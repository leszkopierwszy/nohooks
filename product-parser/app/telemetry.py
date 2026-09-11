from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from typing import Any, Iterator

logger = logging.getLogger(__name__)

_client = None
_enabled: bool | None = None


def tracing_enabled() -> bool:
    global _enabled
    if _enabled is not None:
        return _enabled

    flag = os.getenv('LANGFUSE_TRACING_ENABLED', 'true').lower()
    if flag in ('0', 'false', 'no', 'off'):
        _enabled = False
        return False

    _enabled = bool(os.getenv('LANGFUSE_PUBLIC_KEY') and os.getenv('LANGFUSE_SECRET_KEY'))
    return _enabled


def _configure_env() -> None:
    host = os.getenv('LANGFUSE_HOST', '').rstrip('/')
    if host:
        os.environ.setdefault('LANGFUSE_BASE_URL', host)


def get_langfuse():
    global _client
    if not tracing_enabled():
        return None
    if _client is None:
        _configure_env()
        try:
            from langfuse import get_client

            _client = get_client()
            logger.info('Langfuse tracing enabled (%s)', os.getenv('LANGFUSE_BASE_URL', ''))
        except Exception as exc:
            logger.warning('Langfuse init failed: %s', exc)
            return None
    return _client


def flush() -> None:
    client = get_langfuse()
    if client is not None:
        try:
            client.flush()
        except Exception as exc:
            logger.debug('Langfuse flush: %s', exc)


def _trace_context(trace_id: str | None) -> Any:
    if not trace_id:
        return None
    try:
        from langfuse.types import TraceContext

        tid = trace_id.replace('-', '').strip()[:32]
        return TraceContext(trace_id=tid) if tid else None
    except Exception:
        return None


@contextmanager
def span(
    name: str,
    *,
    input: Any = None,
    metadata: dict[str, Any] | None = None,
    trace_id: str | None = None,
) -> Iterator[Any]:
    client = get_langfuse()
    if client is None:
        yield None
        return

    ctx = _trace_context(trace_id)
    kwargs: dict[str, Any] = {
        'as_type': 'span',
        'name': name,
        'input': input,
        'metadata': metadata or {},
    }
    if ctx is not None:
        kwargs['trace_context'] = ctx

    with client.start_as_current_observation(**kwargs) as observation:
        yield observation


@contextmanager
def generation(
    name: str,
    *,
    model: str,
    input: Any = None,
    metadata: dict[str, Any] | None = None,
) -> Iterator[Any]:
    client = get_langfuse()
    if client is None:
        yield None
        return

    with client.start_as_current_observation(
        as_type='generation',
        name=name,
        model=model,
        input=input,
        metadata=metadata or {},
    ) as observation:
        yield observation


def update_observation(observation: Any, *, output: Any = None, metadata: dict[str, Any] | None = None) -> None:
    if observation is None:
        return
    try:
        if output is not None:
            observation.update(output=output)
        if metadata:
            observation.update(metadata=metadata)
    except Exception as exc:
        logger.debug('Langfuse update: %s', exc)
