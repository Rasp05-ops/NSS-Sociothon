"""Vehicle routing planner using OR-Tools.
Plans optimal collection routes for flagged bins subject to capacity and shift time limits.
Conforms to A5 in docs/FEATURES.md."""
import math
import uuid
from typing import List, Tuple

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from shared.constants import (
    DEPOT,
    MAX_STOPS_PER_ROUTE,
    TRUCK_SHIFT_MIN,
    WASTE_DENSITY_KG_PER_L,
    TRUCK_CAPACITY_KG,
)
from shared.schemas import Bin, Route, RoutePlanRequest, RoutePlanResponse, RouteStop


def haversine_km(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """Computes great circle distance between two points in kilometers."""
    R = 6371.0
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.asin(math.sqrt(a))
    return R * c


def compute_baseline_km(all_bins: List[Bin]) -> float:
    """Fixed route visiting ALL 40 bins using nearest neighbor TSP."""
    if not all_bins:
        return 5.0
    depot_coord = (DEPOT["lat"], DEPOT["lon"])
    unvisited = list(all_bins)
    curr = depot_coord
    total_km = 0.0
    while unvisited:
        nearest = min(unvisited, key=lambda b: haversine_km(curr, (b.lat, b.lon)))
        unvisited.remove(nearest)
        total_km += haversine_km(curr, (nearest.lat, nearest.lon))
        curr = (nearest.lat, nearest.lon)
    total_km += haversine_km(curr, depot_coord)
    return round(total_km, 2)


def heuristic_fallback_route(bins_subset: List[Bin], truck_id: str, route_id: str) -> Route:
    """Nearest neighbor route construction when OR-Tools is bypassed or has 1 stop."""
    depot_coord = (DEPOT["lat"], DEPOT["lon"])
    curr = depot_coord
    km = 0.0
    time_min = 0
    stops = []
    unvisited = list(bins_subset)
    seq = 1

    while unvisited:
        nearest = min(unvisited, key=lambda b: haversine_km(curr, (b.lat, b.lon)))
        unvisited.remove(nearest)
        d = haversine_km(curr, (nearest.lat, nearest.lon))
        km += d
        time_min += int(d / 15.0 * 60) + 4
        stops.append(
            RouteStop(
                seq=seq,
                bin_id=nearest.bin_id,
                building_id=nearest.building_id,
                lat=nearest.lat,
                lon=nearest.lon,
                eta_min=time_min,
                expected_fill_pct=min(100.0, round(nearest.fill_pct + 8.0, 1)),
            )
        )
        curr = (nearest.lat, nearest.lon)
        seq += 1

    km += haversine_km(curr, depot_coord)
    time_min += int(haversine_km(curr, depot_coord) / 15.0 * 60)
    return Route(
        route_id=route_id,
        truck_id=truck_id,
        stops=stops,
        km=round(km, 2),
        est_min=time_min,
    )


def plan_routes_ortools(flagged_bins: List[Bin], all_bins: List[Bin], req: RoutePlanRequest) -> RoutePlanResponse:
    total_bin_count = len(all_bins)
    flagged_count = len(flagged_bins)
    baseline_km = compute_baseline_km(all_bins)

    if not flagged_bins:
        return RoutePlanResponse(
            routes=[],
            total_km=0.0,
            baseline_km=baseline_km,
            km_saved_pct=0.0,
            flagged_bin_count=0,
            total_bin_count=total_bin_count,
            source="real",
        )

    num_trucks = max(1, min(req.trucks, len(flagged_bins)))
    depot_coord = (DEPOT["lat"], DEPOT["lon"])

    # If small number of stops or trucks, heuristic partition works smoothly
    if len(flagged_bins) <= num_trucks:
        routes = []
        for i, b in enumerate(flagged_bins):
            routes.append(heuristic_fallback_route([b], f"T{i+1}", f"R-{uuid.uuid4().hex[:6].upper()}"))
        total_km = round(sum(r.km for r in routes), 2)
        km_saved = round(max(0.0, (1.0 - total_km / baseline_km) * 100), 1)
        return RoutePlanResponse(
            routes=routes,
            total_km=total_km,
            baseline_km=baseline_km,
            km_saved_pct=km_saved,
            flagged_bin_count=flagged_count,
            total_bin_count=total_bin_count,
            source="real",
        )

    # Prepare OR-Tools VRP
    # Node 0 is Depot; Nodes 1..N are flagged bins
    nodes = [depot_coord] + [(b.lat, b.lon) for b in flagged_bins]
    n_nodes = len(nodes)

    # Distance matrix in meters (integer for OR-Tools)
    dist_matrix = [[int(haversine_km(nodes[i], nodes[j]) * 1000) for j in range(n_nodes)] for i in range(n_nodes)]
    # Time matrix in minutes: travel time (at 15 km/h) + service time (4 min at bins)
    time_matrix = []
    for i in range(n_nodes):
        row = []
        for j in range(n_nodes):
            dist_km = dist_matrix[i][j] / 1000.0
            travel_min = int((dist_km / 15.0) * 60)
            service_min = 4 if j > 0 else 0
            row.append(travel_min + service_min)
        time_matrix.append(row)

    manager = pywrapcp.RoutingIndexManager(n_nodes, num_trucks, 0)
    routing = pywrapcp.RoutingModel(manager)

    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    demands = [0] + [
        max(0, round(b.fill_pct / 100.0 * b.capacity_l * WASTE_DENSITY_KG_PER_L))
        for b in flagged_bins
    ]

    def demand_callback(from_index):
        return demands[manager.IndexToNode(from_index)]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,
        [TRUCK_CAPACITY_KG] * num_trucks,
        True,
        "Capacity",
    )

    # Add Shift Time dimension (max 240 min)
    time_dimension_name = "Time"
    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        TRUCK_SHIFT_MIN,  # max shift minutes
        True,  # start cumul to zero
        time_dimension_name,
    )

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_parameters.time_limit.seconds = 2

    solution = routing.SolveWithParameters(search_parameters)

    routes: List[Route] = []
    if solution:
        for vehicle_id in range(num_trucks):
            index = routing.Start(vehicle_id)
            route_stops = []
            km = 0.0
            time_accum = 0
            curr_coord = depot_coord
            seq = 1

            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                if node_index != 0:
                    b = flagged_bins[node_index - 1]
                    d = haversine_km(curr_coord, (b.lat, b.lon))
                    km += d
                    time_accum += int((d / 15.0) * 60) + 4
                    route_stops.append(
                        RouteStop(
                            seq=seq,
                            bin_id=b.bin_id,
                            building_id=b.building_id,
                            lat=b.lat,
                            lon=b.lon,
                            eta_min=time_accum,
                            expected_fill_pct=min(100.0, round(b.fill_pct + 8.0, 1)),
                        )
                    )
                    curr_coord = (b.lat, b.lon)
                    seq += 1
                index = solution.Value(routing.NextVar(index))

            if route_stops:
                return_dist = haversine_km(curr_coord, depot_coord)
                km += return_dist
                time_accum += int((return_dist / 15.0) * 60)
                routes.append(
                    Route(
                        route_id=f"R-{uuid.uuid4().hex[:6].upper()}",
                        truck_id=f"T{vehicle_id+1}",
                        stops=route_stops,
                        km=round(km, 2),
                        est_min=time_accum,
                    )
                )

    # If OR-Tools didn't partition all or failed to find a valid solution, fallback gracefully
    assigned_bins = {s.bin_id for r in routes for s in r.stops}
    if len(assigned_bins) < len(flagged_bins):
        # Fallback: split by vehicle payload capacity instead of silently
        # returning routes that violate the same constraint as the solver.
        routes = []
        sorted_flagged = sorted(flagged_bins, key=lambda b: (b.lat, b.lon))
        chunks: list[list[Bin]] = []
        chunk: list[Bin] = []
        payload = 0
        for bin_item in sorted_flagged:
            demand = max(0, round(bin_item.fill_pct / 100.0 * bin_item.capacity_l * WASTE_DENSITY_KG_PER_L))
            if chunk and payload + demand > TRUCK_CAPACITY_KG:
                chunks.append(chunk)
                chunk, payload = [], 0
            chunk.append(bin_item)
            payload += demand
        if chunk:
            chunks.append(chunk)
        for i, chunk in enumerate(chunks):
            routes.append(heuristic_fallback_route(chunk, f"T{(i % num_trucks) + 1}", f"R-{uuid.uuid4().hex[:6].upper()}"))

    total_km = round(sum(r.km for r in routes), 2)
    km_saved = round(max(0.0, (1.0 - total_km / baseline_km) * 100), 1)

    return RoutePlanResponse(
        routes=routes,
        total_km=total_km,
        baseline_km=baseline_km,
        km_saved_pct=km_saved,
        flagged_bin_count=flagged_count,
        total_bin_count=total_bin_count,
        source="real",
    )
