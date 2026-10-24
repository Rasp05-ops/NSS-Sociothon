// MIRROR of shared/constants.py. Change both in the same PR.
export type WasteCategory = "wet" | "dry" | "paper" | "plastic" | "ewaste" | "hazardous";
export type WorkOrderStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "DISPATCHED" | "COMPLETED";
export type RiskLevel = "low" | "medium" | "high";
export type AgentName = "planner" | "critic" | "dispatcher" | "rag" | "system";

export const RISK_THRESHOLD = 0.7;
export const DEFAULT_HORIZON_H = 12;
export const DEFAULT_TRUCKS = 2;
export const TRUCK_CAPACITY_KG = 120;
export const TZ_DISPLAY = "Asia/Kolkata"; // API is UTC; convert only for display

export const BUILDING_IDS = ["H01", "H02", "H03", "ACAD01", "MESS01", "LIB01"] as const;
export const DEPOT = { name: "Waste Depot", lat: 29.861, lon: 77.9 };
export const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000/api/v1";
