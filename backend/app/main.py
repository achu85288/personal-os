from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
from app.config import settings
from app.api.auth import router as auth_router
from app.infra.tracing import start_span, get_traces, parse_traceparent
from app.infra.db import Base, engine
from app.domain.models import User, RefreshToken  # noqa: F401 - ensure models registered

app = FastAPI(title=settings.app_name, debug=settings.debug)

# CORS
origins = [settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tracing middleware
@app.middleware("http")
async def tracing_middleware(request: Request, call_next):
    traceparent = request.headers.get("traceparent")
    with start_span(f"{request.method} {request.url.path}", attributes={"http.method": request.method, "http.url": str(request.url)}, traceparent=traceparent) as span:
        try:
            response = await call_next(request)
            # Add traceparent to response
            response.headers["traceparent"] = span.trace_id and f"00-{span.trace_id}-{span.span_id}-01" or ""
            span.end(extra_attrs={"http.status_code": response.status_code})
            return response
        except Exception as e:
            span.end(status="error", extra_attrs={"error": str(e)})
            raise

# Exception handlers - RFC style {"detail": ...}, no stack traces in prod
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    if settings.debug:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": f"Internal error: {str(exc)}"})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# Routes
app.include_router(auth_router)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/debug/traces")
async def debug_traces():
    if not settings.debug:
        return JSONResponse(status_code=403, content={"detail": "Debug only"})
    return {"traces": get_traces()[-100:]}

@app.get("/")
async def root():
    return {"message": "Personal OS API", "version": "0.1.0"}
