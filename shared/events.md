# Agent trace events (SSE), owners B (emit) + C (render)
`POST /api/v1/chat` streams lines `data: <TraceEvent JSON>\n\n`. Schema: shared/schemas.py::TraceEvent.
types: tool_call | tool_result | message | approval_request | error | done   (stream ALWAYS ends with `done`)
UI: render each event as a row (agent badge + type + payload summary). On approval_request,
store the payload's thread_id and show the real route_id(s). Approve/Reject calls
POST /chat/resume with that thread_id; the resumed graph creates work orders only after approval.
