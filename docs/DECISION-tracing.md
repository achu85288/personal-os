# DECISION — Tracing

## Context
Requirement: hand-written OTLP-shaped tracer (spans, trace ids, W3C traceparent propagation), exported as JSONL. No OTel SDK.

Options:
- Use OpenTelemetry SDK — violates no-OTel-SDK rule
- Use structlog — not OTLP-shaped
- Hand-write minimal tracer — matches spec

## Decision
- Implement infra/tracing.py with:
  - generate_trace_id(): 32 hex chars (128-bit), generate_span_id(): 16 hex chars (64-bit)
  - parse_traceparent(): parses W3C 00-trace_id-parent_id-flags
  - format_traceparent(): formats back
  - Span class with name, trace_id, span_id, parent_id, start/end nano, status, attributes, traceparent
  - export(): writes JSONL to TRACE_FILE and keeps ring buffer last 512 spans in memory
  - start_span context manager using contextvars for current trace/parent propagation
  - get_traces() returns ring buffer for GET /debug/traces
- Middleware in main.py extracts traceparent header, starts span for each request, adds traceparent to response header
- Auth routes also use start_span with attributes

## Why
- No external SDK, just stdlib + contextvars
- JSONL file is easy to tail and import into any OTLP viewer later
- W3C traceparent propagation allows api->job->worker tracing in later phases
- Ring buffer allows debug endpoint without reading file

## Consequences
- Need to ensure trace file is writable and rotated in prod (not in Phase 1)
- Debug endpoint only when DEBUG=true
