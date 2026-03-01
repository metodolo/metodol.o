/**
 * Auth Context for RADAR V22 / Método L.O
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

  const checkAuth = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setSubscription(data.subscription);
      setUsage(data.usage);
      setFeatures(data.features);
      setError(null);
      return true;
    } catch (err) {
      setUser(null);
      setSubscription(null);
      setUsage(null);
      setFeatures(null);
      return false;
    }
  }, []);

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

  // Heartbeat interval (30 seconds)
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = async () => {
      try {
        const result = await usageApi.heartbeat();
        if (!result.allowed) {
          // Limit exceeded or session invalid
          setError(result.message);
          if (result.reason === "device_mismatch") {
            // Force logout
            logout();
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
        console.error("Heartbeat error:", err);
      }
    };

    // Send immediately
    sendHeartbeat();

    // Then every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (userData, subData) => {
    setUser(userData);
    setSubscription(subData);
    await checkAuth(); // Refresh full data
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setSubscription(null);
      setUsage(null);
      setFeatures(null);
    }
  }, []);

  const value = {
    user,
    subscription,
    usage,
    features,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    logout,
    checkAuth,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
