"""
Authentication dependencies for Garmin token handling.

Uses garth's native dump/load mechanism to preserve all token fields.
Tokens are stored client-side and passed with each request as base64-encoded tar.gz.
"""

import base64
import json
import os
import shutil
import tarfile
import tempfile
from io import BytesIO
from typing import Optional

from fastapi import Header, HTTPException


def decode_tokens_to_dir(authorization: str) -> str:
    """
    Decode tokens from Authorization header to a temp directory.

    Expected format: Bearer <base64_encoded_tar_gz>
    Returns path to temp directory with oauth1_token.json and oauth2_token.json.
    Caller is responsible for cleaning up the directory.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected: Bearer <token>",
        )

    token_b64 = authorization[7:]  # Remove "Bearer " prefix

    try:
        # Decode base64 to tar.gz bytes
        tar_data = base64.b64decode(token_b64)

        # Extract to temp directory
        tmpdir = tempfile.mkdtemp()
        with tarfile.open(fileobj=BytesIO(tar_data), mode="r:gz") as tar:
            tar.extractall(tmpdir)

        # Verify token files exist
        if not os.path.exists(f"{tmpdir}/oauth1_token.json"):
            shutil.rmtree(tmpdir, ignore_errors=True)
            raise ValueError("Missing oauth1_token.json")
        if not os.path.exists(f"{tmpdir}/oauth2_token.json"):
            shutil.rmtree(tmpdir, ignore_errors=True)
            raise ValueError("Missing oauth2_token.json")

        return tmpdir
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token format: {str(e)}",
        )


async def get_token_dir(
    authorization: Optional[str] = Header(None),
) -> Optional[str]:
    """
    FastAPI dependency to extract Garmin tokens to a temp directory.

    Returns path to temp directory, or None if no authorization header.
    Caller must clean up the directory when done.
    """
    if not authorization:
        return None

    return decode_tokens_to_dir(authorization)


async def require_token_dir(
    authorization: str = Header(...),
) -> str:
    """
    FastAPI dependency that requires Garmin tokens.

    Returns path to temp directory with token files.
    Raises 401 if no authorization header provided.
    Caller must clean up the directory when done.
    """
    return decode_tokens_to_dir(authorization)


def encode_tokens_from_garth(garth_client) -> str:
    """
    Encode tokens from a garth client for sending to client.

    Uses garth's native dump to preserve all fields.
    Returns base64-encoded tar.gz string.
    """
    tmpdir = tempfile.mkdtemp()
    try:
        # Dump tokens using garth's native format
        garth_client.dump(tmpdir)

        # Create tar.gz in memory
        tar_buffer = BytesIO()
        with tarfile.open(fileobj=tar_buffer, mode="w:gz") as tar:
            for filename in ["oauth1_token.json", "oauth2_token.json"]:
                filepath = os.path.join(tmpdir, filename)
                if os.path.exists(filepath):
                    tar.add(filepath, arcname=filename)

        # Base64 encode
        tar_buffer.seek(0)
        return base64.b64encode(tar_buffer.read()).decode("utf-8")
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def get_access_token_from_dir(token_dir: str) -> Optional[str]:
    """Extract access token from token directory for refresh detection."""
    try:
        with open(f"{token_dir}/oauth2_token.json") as f:
            data = json.load(f)
            return data.get("access_token")
    except Exception:
        return None
