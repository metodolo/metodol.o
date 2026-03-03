/**
 * Auth Callback Page - Handles Google OAuth redirect
 */
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      try {
        // Get session_id from URL hash
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace("#", ""));
        const sessionId = params.get("session_id");

        if (!sessionId) {
          throw new Error("Session ID não encontrado");
        }

        // Exchange session_id for user data
        const result = await authApi.loginGoogle(sessionId);
        await login(result.user, result.subscription);

        // Clear hash and navigate to dashboard
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/", { replace: true });
      } catch (err) {
        console.error("OAuth callback error:", err);
        navigate("/login", { replace: true, state: { error: err.message } });
      }
    };

    processCallback();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="watermark-bg" />
      <div className="app-container text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#00ff95] mx-auto mb-4" />
        <p className="text-gray-400">Autenticando...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
