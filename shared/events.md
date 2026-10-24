# Agent trace events (SSE), owners B (emit) + C (render)
`POST /api/v1/chat` streams lines `data: <TraceEvent JSON>\n\n`. Schema: shared/schemas.py::TraceEvent.
types: tool_call | tool_result | message | approval_request | error | done   (stream ALWAYS ends with `done`)
UI: render each event as a row (agent badge + type + payload summary). On approval_request show Approve/Reject buttons that call
POST /work-orders/{id}/approve|reject, then (B) resume the graph via runner.stream_chat(resume={"approved": true}).
