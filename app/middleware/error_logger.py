import traceback
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.services.incident_service import infer_service, record_incident, to_iso


class ErrorLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            incident_id = str(uuid.uuid4())
            timestamp = to_iso()
            path = request.url.path
            service_name = infer_service(path, getattr(request.state, "service_name", None))
            error_type = getattr(request.state, "error_type_override", None) or type(exc).__name__
            stack_trace = traceback.format_exc()
            incident = record_incident(
                incident_id=incident_id,
                timestamp=timestamp,
                service=service_name,
                endpoint=path,
                error_type=error_type,
                error_message=str(exc),
                stack_trace=stack_trace,
                metadata={
                    "method": request.method,
                    "path": path,
                    "query": str(request.url.query or ""),
                },
            )

            ws_manager = getattr(request.app.state, "ws_manager", None)
            if ws_manager:
                await ws_manager.broadcast({"type": "NEW_INCIDENT", "incident": incident})

            return JSONResponse(status_code=500, content={"error": "Internal Server Error", "incident_id": incident_id})
