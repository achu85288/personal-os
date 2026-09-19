"""
Hand-written OTLP-shaped tracer (no OTel SDK)
Exports JSONL with W3C traceparent propagation
"""
import uuid
import time
import json
import contextvars
from contextlib import contextmanager
from typing import Optional, Dict, Any
from pathlib import Path
from app.config import settings

# Context vars for current trace/span
current_trace_id = contextvars.ContextVar("trace_id", default=None)
current_span_id = contextvars.ContextVar("span_id", default=None)
current_parent_span_id = contextvars.ContextVar("parent_span_id", default=None)

def generate_trace_id() -> str:
    return uuid.uuid4().hex + uuid.uuid4().hex[:16]  # 32 hex chars (128-bit)

def generate_span_id() -> str:
    return uuid.uuid4().hex[:16]  # 16 hex chars (64-bit)

def parse_traceparent(header: str) -> Optional[Dict[str, str]]:
    # W3C traceparent: 00-trace_id-parent_id-flags
    try:
        parts = header.split("-")
        if len(parts) != 4:
            return None
        version, trace_id, parent_id, flags = parts
        if len(trace_id) != 32 or len(parent_id) != 16:
            return None
        return {"trace_id": trace_id, "parent_id": parent_id, "flags": flags}
    except:
        return None

def format_traceparent(trace_id: str, span_id: str) -> str:
    return f"00-{trace_id}-{span_id}-01"

class Span:
    def __init__(self, name: str, trace_id: str, span_id: str, parent_id: Optional[str] = None, attributes: Optional[Dict[str, Any]] = None):
        self.name = name
        self.trace_id = trace_id
        self.span_id = span_id
        self.parent_id = parent_id
        self.attributes = attributes or {}
        self.start_time = time.time_ns()
        self.end_time: Optional[int] = None
        self.status = "ok"

    def end(self, status: str = "ok", extra_attrs: Optional[Dict[str, Any]] = None):
        self.end_time = time.time_ns()
        self.status = status
        if extra_attrs:
            self.attributes.update(extra_attrs)
        self.export()

    def export(self):
        # JSONL export
        try:
            record = {
                "trace_id": self.trace_id,
                "span_id": self.span_id,
                "parent_id": self.parent_id,
                "name": self.name,
                "start_time_unix_nano": self.start_time,
                "end_time_unix_nano": self.end_time or time.time_ns(),
                "status": self.status,
                "attributes": self.attributes,
                "traceparent": format_traceparent(self.trace_id, self.span_id),
            }
            # Write to file (ring buffer in memory + file)
            path = Path(settings.trace_file)
            with path.open("a") as f:
                f.write(json.dumps(record) + "\n")
            # Also keep in memory ring buffer (last 512)
            _ring_buffer.append(record)
            if len(_ring_buffer) > 512:
                _ring_buffer.pop(0)
        except Exception:
            pass

_ring_buffer: list[dict] = []

def get_traces() -> list[dict]:
    return list(_ring_buffer)

@contextmanager
def start_span(name: str, attributes: Optional[Dict[str, Any]] = None, traceparent: Optional[str] = None):
    # Determine trace_id and parent
    parent_trace_id = current_trace_id.get()
    parent_span_id = current_span_id.get()

    if traceparent:
        parsed = parse_traceparent(traceparent)
        if parsed:
            trace_id = parsed["trace_id"]
            parent_id = parsed["parent_id"]
        else:
            trace_id = parent_trace_id or generate_trace_id()
            parent_id = parent_span_id
    else:
        trace_id = parent_trace_id or generate_trace_id()
        parent_id = parent_span_id

    span_id = generate_span_id()
    span = Span(name=name, trace_id=trace_id, span_id=span_id, parent_id=parent_id, attributes=attributes)

    # Set context
    token_trace = current_trace_id.set(trace_id)
    token_span = current_span_id.set(span_id)
    token_parent = current_parent_span_id.set(parent_id)

    try:
        yield span
        if span.end_time is None:
            span.end()
    except Exception as e:
        if span.end_time is None:
            span.end(status="error", extra_attrs={"error": str(e)})
        raise
    finally:
        current_trace_id.reset(token_trace)
        current_span_id.reset(token_span)
        current_parent_span_id.reset(token_parent)
