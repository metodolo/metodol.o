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
  UserPlus,
  Mail,
  Trash2,
} from "lucide-react";

const AdminPage = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("users"); // users or pending
  
  // Form state for new pending subscription
  const [newEmail, setNewEmail] = useState("");
  const [newSubType, setNewSubType] = useState("trial");
  const [newTrialDays, setNewTrialDays] = useState(7);
  const [newNotes, setNewNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);

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

  // Load pending subscriptions
  const loadPendingSubscriptions = async () => {
    try {
      const data = await adminApi.listPendingSubscriptions();
      setPendingSubscriptions(data.pending_subscriptions || []);
    } catch (err) {
      console.error("Error loading pending subscriptions:", err);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadPendingSubscriptions()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
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

  // Create pending subscription
  const createPendingSubscription = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setError("Por favor, insira um email válido");
      return;
    }
    
    setFormLoading(true);
    try {
      await adminApi.createPendingSubscription(newEmail.trim(), newSubType, newTrialDays, newNotes.trim());
      // Reset form
      setNewEmail("");
      setNewSubType("trial");
      setNewTrialDays(7);
      setNewNotes("");
      // Reload list
      await loadPendingSubscriptions();
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete pending subscription
  const deletePendingSubscription = async (pendingId) => {
    setActionLoading(pendingId);
    try {
      await adminApi.deletePendingSubscription(pendingId);
      await loadPendingSubscriptions();
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

  // Subscription options
  const subscriptionOptions = [
    { label: "Nenhum", value: "none", color: "gray" },
    { label: "Teste", value: "trial", color: "yellow" },
    { label: "Mensal", value: "monthly", color: "blue" },
    { label: "Anual", value: "yearly", color: "purple" },
    { label: "Vitalício", value: "lifetime", color: "green" },
  ];

  // Trial days options
  const trialDaysOptions = [3, 7, 14, 30];

  // Update subscription
  const updateSubscription = async (userId, status, trialDays = null) => {
    setActionLoading(userId);
    try {
      const data = { subscription_status: status };
      if (status === "trial" && trialDays) {
        data.trial_days = trialDays;
      }
      await adminApi.updateUser(userId, data);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen pb-10">
      {/* Watermark */}
      <div className="watermark-bg" />

      <div className="app-container max-w-[900px] mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
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
            onClick={loadAllData}
            className="ml-auto p-2 bg-[#222] rounded-lg hover:bg-[#333] transition-colors"
            data-testid="refresh-btn"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 border-2 ${
              activeTab === "users" 
                ? "bg-black text-white border-[#D4AF37]" 
                : "bg-[#222] text-gray-400 border-transparent hover:border-[#333]"
            }`}
            data-testid="tab-users"
          >
            <Users className="w-4 h-4" />
            Usuários ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 border-2 ${
              activeTab === "pending" 
                ? "bg-black text-white border-[#D4AF37]" 
                : "bg-[#222] text-gray-400 border-transparent hover:border-[#333]"
            }`}
            data-testid="tab-pending"
          >
            <UserPlus className="w-4 h-4" />
            Pré-Cadastros ({pendingSubscriptions.length})
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">✕</button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#00ff95] mx-auto" />
          </div>
        ) : activeTab === "pending" ? (
          /* Pending Subscriptions Tab */
          <div className="space-y-4">
            {/* Add new pending subscription form */}
            <div className="card-glass p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#D4AF37]">
                <UserPlus className="w-5 h-5" />
                Adicionar Pré-Cadastro
              </h3>
              <form onSubmit={createPendingSubscription} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email do futuro usuário</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="exemplo@email.com"
                      className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                      data-testid="input-new-email"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tipo de Assinatura</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Teste", value: "trial", color: "yellow" },
                      { label: "Mensal", value: "monthly", color: "blue" },
                      { label: "Anual", value: "yearly", color: "purple" },
                      { label: "Vitalício", value: "lifetime", color: "green" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewSubType(opt.value)}
                        className={`px-3 py-2 rounded text-sm font-bold ${
                          newSubType === opt.value
                            ? opt.color === "yellow" ? "bg-yellow-500 text-black" :
                              opt.color === "blue" ? "bg-blue-500 text-white" :
                              opt.color === "purple" ? "bg-purple-500 text-white" :
                              "bg-green-500 text-white"
                            : opt.color === "yellow" ? "bg-yellow-500/20 text-yellow-400" :
                              opt.color === "blue" ? "bg-blue-500/20 text-blue-400" :
                              opt.color === "purple" ? "bg-purple-500/20 text-purple-400" :
                              "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {newSubType === "trial" && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Dias de Teste</label>
                    <div className="flex gap-2">
                      {[3, 7, 14, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setNewTrialDays(days)}
                          className={`px-3 py-2 rounded text-sm font-bold ${
                            newTrialDays === days
                              ? "bg-yellow-500 text-black"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {days} dias
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Observações (opcional)</label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Ex: Cliente VIP, indicação do João..."
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                    data-testid="input-new-notes"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading || !newEmail.trim()}
                  className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#c9a030] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="btn-add-pending"
                >
                  {formLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Adicionar Pré-Cadastro
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* List of pending subscriptions */}
            <div className="card-glass p-4">
              <h3 className="text-lg font-bold mb-4 text-white">
                Pré-Cadastros Pendentes ({pendingSubscriptions.length})
              </h3>
              
              {pendingSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum pré-cadastro pendente.
                  <br />
                  <span className="text-sm">Adicione emails acima para configurar assinaturas antes do cadastro.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSubscriptions.map((ps) => (
                    <div
                      key={ps.id}
                      className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 flex flex-wrap items-center gap-3"
                      data-testid={`pending-${ps.id}`}
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {ps.email}
                        </div>
                        {ps.notes && (
                          <div className="text-xs text-gray-500 mt-1">{ps.notes}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Criado em: {new Date(ps.created_at).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      
                      <span
                        className={`px-3 py-1 rounded text-sm font-bold ${
                          ps.subscription_type === "trial" ? "bg-yellow-500/20 text-yellow-400" :
                          ps.subscription_type === "monthly" ? "bg-blue-500/20 text-blue-400" :
                          ps.subscription_type === "yearly" ? "bg-purple-500/20 text-purple-400" :
                          "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {ps.subscription_type === "trial" ? `Teste (${ps.trial_days || 7} dias)` :
                         ps.subscription_type === "monthly" ? "Mensal" :
                         ps.subscription_type === "yearly" ? "Anual" :
                         "Vitalício"}
                      </span>
                      
                      <button
                        onClick={() => deletePendingSubscription(ps.id)}
                        disabled={actionLoading === ps.id}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        data-testid={`delete-pending-${ps.id}`}
                      >
                        {actionLoading === ps.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

                {/* Subscription Management */}
                <div className="mt-4 pt-4 border-t border-[#333]">
                  <div className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Gerenciar Assinatura
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Subscription type buttons */}
                    {subscriptionOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateSubscription(u.id, opt.value)}
                        disabled={actionLoading === u.id}
                        className={`px-3 py-2 rounded text-sm font-bold ${
                          u.subscription_status === opt.value
                            ? opt.color === "gray" ? "bg-gray-500 text-white" :
                              opt.color === "yellow" ? "bg-yellow-500 text-black" :
                              opt.color === "blue" ? "bg-blue-500 text-white" :
                              opt.color === "purple" ? "bg-purple-500 text-white" :
                              "bg-green-500 text-white"
                            : opt.color === "gray" ? "bg-gray-500/20 text-gray-400" :
                              opt.color === "yellow" ? "bg-yellow-500/20 text-yellow-400" :
                              opt.color === "blue" ? "bg-blue-500/20 text-blue-400" :
                              opt.color === "purple" ? "bg-purple-500/20 text-purple-400" :
                              "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Trial days selector (only show if subscription is trial) */}
                  {u.subscription_status === "trial" && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-gray-400">Dias de teste:</span>
                      {trialDaysOptions.map((days) => (
                        <button
                          key={days}
                          onClick={() => updateSubscription(u.id, "trial", days)}
                          disabled={actionLoading === u.id}
                          className="px-2 py-1 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                        >
                          {days} dias
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Subscription info */}
                  {u.subscription_end && (
                    <div className="mt-2 text-xs text-gray-500">
                      Expira em: {new Date(u.subscription_end).toLocaleDateString("pt-BR")}
                    </div>
                  )}
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
