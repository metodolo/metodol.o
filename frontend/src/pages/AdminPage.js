/**
 * Admin Page
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminApi } from "../services/api";
import {
  ArrowLeft,
  Users,
  Check,
  X,
  CreditCard,
  Clock,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
} from "lucide-react";

const AdminPage = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listUsers();
      setUsers(data.users);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Format seconds to hours
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  // Update user
  const updateUser = async (userId, data) => {
    setActionLoading(userId);
    try {
      await adminApi.updateUser(userId, data);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Simulate payment
  const simulatePayment = async (userId) => {
    setActionLoading(userId);
    try {
      await adminApi.simulatePayment(userId);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Invalidate sessions
  const invalidateSessions = async (userId) => {
    setActionLoading(userId);
    try {
      await adminApi.invalidateSessions(userId);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Limit options
  const limitOptions = [
    { label: "1h", value: 3600 },
    { label: "2h", value: 7200 },
    { label: "4h", value: 14400 },
    { label: "8h", value: 28800 },
    { label: "Ilimitado", value: 86400 },
  ];

  return (
    <div className="min-h-screen pb-10">
      {/* Watermark */}
      <div className="watermark-bg" />

      <div className="app-container max-w-[900px] mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/")}
            className="p-2 bg-[#222] rounded-lg hover:bg-[#333] transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00ff95]" />
            Painel Admin
          </h1>
          <button
            onClick={loadUsers}
            className="ml-auto p-2 bg-[#222] rounded-lg hover:bg-[#333] transition-colors"
            data-testid="refresh-btn"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#00ff95] mx-auto" />
          </div>
        ) : (
          /* Users list */
          <div className="space-y-4" data-testid="users-list">
            {users.map((u) => (
              <div
                key={u.id}
                className={`card-glass p-4 ${u.id === user?.id ? "border-[#ccff00]" : ""}`}
                data-testid={`user-card-${u.id}`}
              >
                {/* User info */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{u.name || "Sem nome"}</span>
                      {u.role === "admin" && (
                        <span className="text-xs bg-[#ccff00] text-black px-2 py-0.5 rounded">ADMIN</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">{u.email}</div>
                    {u.cpf && <div className="text-sm text-gray-500">{u.cpf}</div>}
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    {/* Active status */}
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        u.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {u.is_active ? "Ativo" : "Inativo"}
                    </span>

                    {/* Subscription */}
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        u.subscription_status === "active"
                          ? "bg-[#00ff95]/20 text-[#00ff95]"
                          : u.subscription_status === "trial"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {u.subscription_status || "none"}
                    </span>

                    {/* API enabled */}
                    <span
                      className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                        u.api_enabled ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {u.api_enabled ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      API
                    </span>
                  </div>
                </div>

                {/* Usage info */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-4 h-4" />
                    Usado hoje: {formatTime(u.seconds_used_today)} / {formatTime(u.daily_seconds_limit)}
                  </div>
                  {u.device_label && (
                    <div className="text-gray-500 truncate max-w-[300px]">
                      Dispositivo: {u.device_label?.substring(0, 50)}...
                    </div>
                  )}
                  {u.last_activity && (
                    <div className="text-gray-500">
                      Última atividade: {new Date(u.last_activity).toLocaleString("pt-BR")}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#333]">
                  {/* Toggle active */}
                  <button
                    onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                    disabled={actionLoading === u.id}
                    className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-1 ${
                      u.is_active ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {u.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {u.is_active ? "Desativar" : "Ativar"}
                  </button>

                  {/* Simulate payment */}
                  <button
                    onClick={() => simulatePayment(u.id)}
                    disabled={actionLoading === u.id}
                    className="px-3 py-2 rounded text-sm font-bold bg-[#00ff95]/20 text-[#00ff95] flex items-center gap-1"
                  >
                    <CreditCard className="w-4 h-4" />
                    Simular Pagamento
                  </button>

                  {/* Toggle API */}
                  <button
                    onClick={() => updateUser(u.id, { api_enabled: !u.api_enabled })}
                    disabled={actionLoading === u.id}
                    className={`px-3 py-2 rounded text-sm font-bold flex items-center gap-1 ${
                      u.api_enabled ? "bg-gray-500/20 text-gray-400" : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {u.api_enabled ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                    {u.api_enabled ? "Desativar API" : "Ativar API"}
                  </button>

                  {/* Invalidate sessions */}
                  <button
                    onClick={() => invalidateSessions(u.id)}
                    disabled={actionLoading === u.id}
                    className="px-3 py-2 rounded text-sm font-bold bg-orange-500/20 text-orange-400"
                  >
                    Derrubar Sessões
                  </button>

                  {/* Limit selector */}
                  <select
                    value={u.daily_seconds_limit}
                    onChange={(e) => updateUser(u.id, { daily_seconds_limit: parseInt(e.target.value) })}
                    disabled={actionLoading === u.id}
                    className="px-3 py-2 rounded text-sm bg-[#222] text-white border border-[#333]"
                  >
                    {limitOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        Limite: {opt.label}
                      </option>
                    ))}
                  </select>

                  {actionLoading === u.id && <Loader2 className="w-5 h-5 animate-spin text-[#00ff95]" />}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-10 text-gray-500">Nenhum usuário encontrado</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
