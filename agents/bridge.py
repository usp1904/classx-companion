"""
Bridge service: HTTP server that exposes the Python agent layer to the Node.js backend.

Provides REST endpoints for each loop type so the Node.js `routes/api.js`
or `services/aiTutor.js` can call them directly.

Endpoints:
  POST /agents/agent-loop
  POST /agents/verification-loop
  POST /agents/event-loop
  POST /agents/hill-climb
  POST /agents/full-pipeline
  GET  /agents/health

Usage:
  python agents/bridge.py [--port 8765]
"""

from __future__ import annotations

import json
import logging
import os
import sys
from typing import Any, Dict

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from aiohttp import web
except ImportError:
    import subprocess
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "aiohttp"]
    )
    from aiohttp import web

from agents.models import AgentMode, StudentProfile
from agents.orchestrator import get_orchestrator

logger = logging.getLogger("agents.bridge")
orchestrator = get_orchestrator()


async def handle_agent_loop(request: web.Request) -> web.Response:
    try:
        body = await request.json()
        result = await orchestrator.run_agent_loop(
            question=body.get("question", ""),
            student_answer=body.get("student_answer"),
            mode=AgentMode(body.get("mode", "DUAL")),
            context=body.get("context"),
            student=(
                StudentProfile(**body["student"])
                if body.get("student")
                else None
            ),
        )
        return web.json_response(result)
    except Exception as e:
        logger.error("Agent loop error: %s", e)
        return web.json_response({"error": str(e)}, status=500)


async def handle_verification(request: web.Request) -> web.Response:
    try:
        body = await request.json()
        result = await orchestrator.run_verification_loop(
            content=body.get("content"),
            context=body.get("context"),
        )
        return web.json_response(result)
    except Exception as e:
        logger.error("Verification loop error: %s", e)
        return web.json_response({"error": str(e)}, status=500)


async def handle_event_loop(request: web.Request) -> web.Response:
    try:
        body = await request.json()
        result = await orchestrator.run_event_loop(
            event_type=body.get("event_type", "question_asked"),
            student_id=body.get("student_id", "anonymous"),
            payload=body.get("payload"),
            student=(
                StudentProfile(**body["student"])
                if body.get("student")
                else None
            ),
        )
        return web.json_response(result)
    except Exception as e:
        logger.error("Event loop error: %s", e)
        return web.json_response({"error": str(e)}, status=500)


async def handle_hill_climb(request: web.Request) -> web.Response:
    try:
        body = await request.json()
        result = await orchestrator.run_hill_climb_loop(
            student=StudentProfile(**body.get("student", {})),
        )
        return web.json_response(result)
    except Exception as e:
        logger.error("Hill climb error: %s", e)
        return web.json_response({"error": str(e)}, status=500)


async def handle_full_pipeline(request: web.Request) -> web.Response:
    try:
        body = await request.json()
        result = await orchestrator.run_full_pipeline(
            question=body.get("question", ""),
            student_answer=body.get("student_answer"),
            mode=AgentMode(body.get("mode", "DUAL")),
            context=body.get("context"),
            student=(
                StudentProfile(**body["student"])
                if body.get("student")
                else None
            ),
        )
        return web.json_response(result)
    except Exception as e:
        logger.error("Full pipeline error: %s", e)
        return web.json_response({"error": str(e)}, status=500)


async def handle_health(request: web.Request) -> web.Response:
    return web.json_response(
        {
            "ok": True,
            "service": "ClassX Agent Bridge",
            "loops": [
                "agent_loop",
                "verification_loop",
                "event_loop",
                "hill_climb",
                "full_pipeline",
            ],
            "status": "ready",
        }
    )


def create_app() -> web.Application:
    app = web.Application()
    app.router.add_post("/agents/agent-loop", handle_agent_loop)
    app.router.add_post("/agents/verification-loop", handle_verification)
    app.router.add_post("/agents/event-loop", handle_event_loop)
    app.router.add_post("/agents/hill-climb", handle_hill_climb)
    app.router.add_post("/agents/full-pipeline", handle_full_pipeline)
    app.router.add_get("/agents/health", handle_health)
    return app


if __name__ == "__main__":
    port = int(os.environ.get("AGENT_BRIDGE_PORT", "8765"))
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    app = create_app()
    logger.info("Agent bridge starting on http://0.0.0.0:%d", port)
    web.run_app(app, host="0.0.0.0", port=port)
