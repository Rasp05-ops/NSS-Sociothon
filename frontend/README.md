# Frontend (owner: C)
Suggested: Vite + React + TypeScript + Leaflet + Recharts. (If React slows you down, Streamlit is acceptable — judges grade the flow.)
Setup: `npm create vite@latest . -- --template react-ts` then `npm i leaflet react-leaflet recharts openapi-typescript`.
- API base: `import { API_BASE } from "../../shared/constants"` (or VITE_API_BASE). Types: `make types` -> src/api/types.ts. Never hand-write API types.
- Colours: risk_level low=green, medium=amber, high=red. Show `source` ("mock") as a small badge so demos are never misleading.
- Pages: Map+KPIs, Forecast chart (band = lower/upper), Approval inbox, Chat+Trace, Impact summary.
