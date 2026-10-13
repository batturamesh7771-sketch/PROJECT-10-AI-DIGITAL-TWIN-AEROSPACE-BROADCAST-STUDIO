"""
simli_livekit_agent.py - LiveKit Agents Integration with Simli Avatar
Connects LiveKit Realtime Agent session to Simli talking avatar, powered by Gemini 2.5 Pro.
"""

import logging
import os
from dotenv import load_dotenv

logger = logging.getLogger("simli-avatar-gemini")
logger.setLevel(logging.INFO)

load_dotenv(override=True)

try:
    from livekit.agents import (
        Agent,
        AgentSession,
        JobContext,
        WorkerOptions,
        WorkerType,
        cli,
    )
    from livekit.plugins import openai, simli
except ImportError:
    logger.warning("LiveKit plugins not installed. Run: pip install livekit-agents livekit-plugins-simli livekit-plugins-openai")


async def entrypoint(ctx: "JobContext"):
    # Powered by Gemini 2.5 Pro
    model_name = os.getenv("PRIMARY_LLM_MODEL", "gemini-2.5-pro")

    session = AgentSession(
        llm=openai.realtime.RealtimeModel(
            model=model_name,
            voice="alloy"
        ),
    )

    simliAPIKey = os.getenv("SIMLI_API_KEY", "")
    simliFaceID = os.getenv("SIMLI_FACE_ID", "0655685c-c0ab-41af-95ed-2adbc4def4a2")

    simli_avatar = simli.AvatarSession(
        simli_config=simli.SimliConfig(
            api_key=simliAPIKey,
            face_id=simliFaceID,
        ),
    )
    await simli_avatar.start(session, room=ctx.room)

    await session.start(
        agent=Agent(instructions="You are the AI guest on Nikhil's aerospace podcast. Powered by Gemini 2.5 Pro. Answer naturally, conversationally, and concisely!"),
        room=ctx.room,
    )


if __name__ == "__main__":
    try:
        cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, worker_type=WorkerType.ROOM))
    except Exception as e:
        print(f"LiveKit agent runner notice: {e}")
