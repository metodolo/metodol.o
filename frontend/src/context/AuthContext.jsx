/**
 * Auth Context for RADAR V22 / Método L.O
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authApi, usageApi } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [sessionKicked, setSessionKicked] = useState(false);
  
  // Ref to track if we're logged in (for intervals)
  const isLoggedInRef = useRef(false);

  const forceLogout = useCallback(() => {
    console.log("Force logout triggered");
    localStorage.removeItem("session_token");
    setUser(null);
    setSubscription(null);
    setUsage(null);
    setFeatures(null);
    setMustChangePassword(false);
    isLoggedInRef.current = false;
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setSubscription(data.subscription);
      setUsage(data.usage);
      setFeatures(data.features);
      setMustChangePassword(data.user?.must_change_password || false);
      setError(null);
      isLoggedInRef.current = true;
      return true;
    } catch (err) {
      forceLogout();
      return false;
    }
  }, [forceLogout]);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check
    // AuthCallback will exchange the session_id and establish the session first
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      await checkAuth();
      setLoading(false);
    };

    init();
  }, [checkAuth]);

  // Session validation interval (every 15 seconds)
  useEffect(() => {
    if (!user) return;

    const validateSession = async () => {
      if (!isLoggedInRef.current) return;
      
      try {
        const result = await authApi.validateSession();
        
        if (!result.valid) {
          setError(result.message || "Sua conta foi conectada em outro dispositivo");
          setSessionKicked(true);
          forceLogout();
          window.location.href = "/login";
        }
      } catch (err) {
        // Network error - don't logout, just skip this check
        console.warn("Session check failed, will retry");
      }
    };

    validateSession();
    const sessionInterval = setInterval(validateSession, 15000);

    return () => clearInterval(sessionInterval);
  }, [user, forceLogout]);

  // Heartbeat interval (60 seconds) - for usage tracking
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = async () => {
      if (!isLoggedInRef.current) return;
      
      try {
        const result = await usageApi.heartbeat();
        if (!result.allowed) {
          setError(result.message);
          if (result.reason === "device_mismatch") {
            setSessionKicked(true);
            forceLogout();
            window.location.href = "/login";
          }
        } else {
          setUsage({
            seconds_used: result.seconds_used,
            seconds_limit: result.seconds_limit,
            seconds_remaining: result.seconds_remaining,
            limit_exceeded: false,
          });
        }
      } catch (err) {
        // Network error - skip this heartbeat
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000);

    return () => clearInterval(interval);
  }, [user, forceLogout]);

  const login = useCallback(async (userData, subData) => {
    setUser(userData);
    setSubscription(subData);
    setMustChangePassword(userData?.must_change_password || false);
    setSessionKicked(false);
    isLoggedInRef.current = true;
    await checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      forceLogout();
    }
  }, [forceLogout]);

  const clearMustChangePassword = useCallback(() => {
    setMustChangePassword(false);
    if (user) {
      setUser({ ...user, must_change_password: false });
    }
  }, [user]);

  const value = {
    user,
    subscription,
    usage,
    features,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    mustChangePassword,
    sessionKicked,
    login,
    logout,
    checkAuth,
    setError,
    clearMustChangePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
