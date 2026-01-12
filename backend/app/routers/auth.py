"""
Authentication router for Garmin Connect.

Handles login flow including MFA, returns tokens for client-side storage.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from garminconnect import Garmin

from dependencies.auth import encode_tokens_from_garth


router = APIRouter(prefix="/auth", tags=["auth"])


# Store pending MFA sessions (in-memory, keyed by email)
# In production with multiple instances, use Redis
# Stores tuple of (Garmin client, client_state from login)
_pending_mfa: dict[str, tuple] = {}


class LoginRequest(BaseModel):
    """Garmin login credentials."""

    email: str
    password: str


class LoginResponse(BaseModel):
    """Response from login attempt."""

    status: str  # "success", "mfa_required", "error"
    message: str
    tokens: Optional[str] = None  # Base64-encoded tar.gz of token files


class MFARequest(BaseModel):
    """MFA code submission."""

    email: str
    code: str


class MFAResponse(BaseModel):
    """Response from MFA submission."""

    status: str  # "success", "error"
    message: str
    tokens: Optional[str] = None  # Base64-encoded tar.gz of token files


@router.post("/garmin/login", response_model=LoginResponse)
async def garmin_login(request: LoginRequest):
    """
    Initiate Garmin login.

    If MFA is required, returns status="mfa_required" and client should
    call /auth/garmin/mfa with the code from email/SMS.

    If successful, returns base64-encoded tokens for client storage.
    """
    try:
        # Create Garmin client with MFA handling
        garmin = Garmin(request.email, request.password, return_on_mfa=True)

        result = garmin.login()

        # Check if MFA is required
        # When MFA is needed with return_on_mfa=True, login() returns a tuple:
        # ('needs_mfa', {client_state_dict with 'client' key})
        if isinstance(result, tuple) and len(result) == 2:
            mfa_indicator, client_state = result
            if mfa_indicator == "needs_mfa" and isinstance(client_state, dict):
                # Store client and state for MFA completion
                _pending_mfa[request.email] = (garmin, client_state)

                return LoginResponse(
                    status="mfa_required",
                    message="MFA code required. Check your email or SMS for the verification code.",
                )

        # Also check for plain string "needs_mfa" (older library versions)
        if result == "needs_mfa":
            client_state = garmin.garth.oauth1_token
            _pending_mfa[request.email] = (garmin, client_state)

            return LoginResponse(
                status="mfa_required",
                message="MFA code required. Check your email or SMS for the verification code.",
            )

        # Login successful - use garth's native dump to serialize tokens
        tokens_b64 = encode_tokens_from_garth(garmin.garth)

        return LoginResponse(
            status="success",
            message="Login successful",
            tokens=tokens_b64,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()

        # Check for authentication errors
        if any(keyword in error_msg for keyword in ["invalid", "credentials", "unauthorized", "401"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.post("/garmin/mfa", response_model=MFAResponse)
async def garmin_mfa(request: MFARequest):
    """
    Complete MFA verification.

    Submit the code received via email/SMS after /garmin/login returned mfa_required.
    Returns base64-encoded tokens for client storage.
    """
    pending = _pending_mfa.get(request.email)

    if not pending:
        raise HTTPException(
            status_code=400,
            detail="No pending MFA session. Please login again.",
        )

    # Extract garmin client and client_state from stored tuple
    garmin, client_state = pending

    try:
        # Resume login with MFA code using the stored client state
        garmin.resume_login(client_state, request.code)

        # Use garth's native dump to serialize tokens
        tokens_b64 = encode_tokens_from_garth(garmin.garth)

        # Clean up pending session
        del _pending_mfa[request.email]

        return MFAResponse(
            status="success",
            message="MFA verification successful",
            tokens=tokens_b64,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)

        if "invalid" in error_msg.lower() or "code" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid MFA code")

        raise HTTPException(status_code=500, detail=f"MFA failed: {error_msg}")


@router.post("/garmin/logout")
async def garmin_logout():
    """
    Logout hint endpoint.

    Client should clear stored tokens. Server doesn't store anything.
    """
    return {"status": "success", "message": "Clear tokens from device storage"}
