/**
 * API service for RADAR V22 / Método L.O
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Generate a persistent device ID
export const getDeviceId = () => {
  let deviceId = localStorage.getItem("radar_device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("radar_device_id", deviceId);
  }
  return deviceId;
};

// Get device label (browser info)
export const getDeviceLabel = () => {
  const ua = navigator.userAgent;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `${ua.substring(0, 100)} | ${timezone}`;
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API}${endpoint}`;
  const defaultOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  // Add Authorization header from localStorage if exists
  const sessionToken = localStorage.getItem("session_token");
  if (sessionToken) {
    defaultOptions.headers["Authorization"] = `Bearer ${sessionToken}`;
  }

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erro desconhecido" }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  return response.json();
};

// ============== Auth API ==============

export const authApi = {
  // Register with CPF
  register: async (cpf, email, password, name) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ cpf, email, password, name }),
    });
  },

  // Login with CPF
  loginCPF: async (cpf, password) => {
    const deviceId = getDeviceId();
    const deviceLabel = getDeviceLabel();
    const result = await apiRequest("/auth/login/cpf", {
      method: "POST",
      body: JSON.stringify({ cpf, password, device_id: deviceId, device_label: deviceLabel }),
    });
    // Store session token
    if (result.session_token) {
      localStorage.setItem("session_token", result.session_token);
    }
    return result;
  },

  // Login with Google (Emergent OAuth)
  loginGoogle: async (sessionId) => {
    const deviceId = getDeviceId();
    const deviceLabel = getDeviceLabel();
    const result = await apiRequest("/auth/login/google", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, device_id: deviceId, device_label: deviceLabel }),
    });
    // Store session token
    if (result.session_token) {
      localStorage.setItem("session_token", result.session_token);
    }
    return result;
  },

  // Get current user
  getMe: async () => {
    return apiRequest("/auth/me");
  },

  // Logout
  logout: async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("session_token");
    }
  },

  // Validate session
  validateSession: async () => {
    const deviceId = getDeviceId();
    return apiRequest("/auth/validate-session", {
      method: "POST",
      body: JSON.stringify({ device_id: deviceId }),
    });
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },
};

// ============== Usage API ==============

export const usageApi = {
  // Send heartbeat
  heartbeat: async () => {
    const deviceId = getDeviceId();
    return apiRequest("/usage/heartbeat", {
      method: "POST",
      body: JSON.stringify({ device_id: deviceId }),
    });
  },

  // Get usage status
  getStatus: async () => {
    return apiRequest("/usage/status");
  },
};

// ============== Admin API ==============

export const adminApi = {
  // List all users
  listUsers: async () => {
    return apiRequest("/admin/users");
  },

  // Update user
  updateUser: async (userId, data) => {
    return apiRequest(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Simulate payment
  simulatePayment: async (userId) => {
    return apiRequest(`/admin/users/${userId}/simulate-payment`, {
      method: "POST",
    });
  },

  // Invalidate user sessions
  invalidateSessions: async (userId) => {
    return apiRequest(`/admin/users/${userId}/sessions`, {
      method: "DELETE",
    });
  },

  // List pending subscriptions
  listPendingSubscriptions: async () => {
    return apiRequest("/admin/pending-subscriptions");
  },

  // Create pending subscription
  createPendingSubscription: async (email, subscriptionType, trialDays, notes) => {
    return apiRequest("/admin/pending-subscriptions", {
      method: "POST",
      body: JSON.stringify({ 
        email, 
        subscription_type: subscriptionType, 
        trial_days: trialDays,
        notes 
      }),
    });
  },

  // Delete pending subscription
  deletePendingSubscription: async (pendingId) => {
    return apiRequest(`/admin/pending-subscriptions/${pendingId}`, {
      method: "DELETE",
    });
  },

  // List blacklist
  listBlacklist: async () => {
    return apiRequest("/admin/blacklist");
  },

  // Add to blacklist
  addToBlacklist: async (type, value, reason) => {
    return apiRequest("/admin/blacklist", {
      method: "POST",
      body: JSON.stringify({ type, value, reason }),
    });
  },

  // Remove from blacklist
  removeFromBlacklist: async (blacklistId) => {
    return apiRequest(`/admin/blacklist/${blacklistId}`, {
      method: "DELETE",
    });
  },
};

// ============== Health API ==============

export const healthApi = {
  check: async () => {
    return apiRequest("/health");
  },
};

// Google OAuth URL generator
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export const getGoogleAuthUrl = () => {
  const redirectUrl = window.location.origin + "/auth/callback";
  return `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
};
