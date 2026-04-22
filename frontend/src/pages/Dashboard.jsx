/**
 * Main Dashboard Page
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RadarTab from "../components/RadarTab";
import GestaoTab from "../components/GestaoTab";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { LogOut, Settings, User, Clock, Shield, Smartphone, Monitor } from "lucide-react";

const Dashboard = () => {
  const { user, subscription, usage, logout, isAdmin, error, setError, mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("radar");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("viewMode") || "vertical");

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
    if (viewMode === "horizontal") {
      document.documentElement.classList.add("mode-horizontal");
    } else {
      document.documentElement.classList.remove("mode-horizontal");
    }
    return () => document.documentElement.classList.remove("mode-horizontal");
  }, [viewMode]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={viewMode === "horizontal" ? "h-screen overflow-hidden" : "min-h-screen pb-10"}>
      {/* Change Password Modal */}
      {mustChangePassword && (
        <ChangePasswordModal onSuccess={() => {}} />
      )}

      {/* Watermark */}
      <div className="watermark-bg" />

      <div className={viewMode === "horizontal"
        ? "app-container w-full h-full flex flex-col p-1 min-h-0 overflow-hidden"
        : "app-container max-w-[600px] lg:max-w-[800px] xl:max-w-[900px] mx-auto p-2 lg:p-4"
      }>
        {/* Error banner */}
        {error && (
          <div
            className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-1 text-sm flex justify-between items-center"
            data-testid="error-banner"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">✕</button>
          </div>
        )}

        {/* Status bar */}
        <div className={`flex items-center justify-between bg-[rgba(17,17,17,0.8)] rounded-lg border border-[#333] ${viewMode === "horizontal" ? "p-1 px-3 mb-1" : "p-3 mb-3"}`}>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#00ff95]" />
            <span className="text-sm text-gray-300 truncate max-w-[150px]">
              {user?.name || user?.email?.split("@")[0] || "Usuário"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Subscription status */}
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  subscription?.status === "active" ? "bg-[#00ff95]" : "bg-yellow-500"
                }`}
              />
              <span className="text-xs text-gray-400">
                {subscription?.status === "active" ? "Ativo" : "Trial"}
              </span>
            </div>

            {/* Time remaining */}
            {usage && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {formatTime(usage.seconds_remaining)}
              </div>
            )}

            {/* Admin button */}
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="p-1 text-[#ccff00] hover:text-white transition-colors"
                data-testid="admin-btn"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs + View Mode Toggle */}
        <div className={`flex gap-2 sticky top-0 z-50 bg-black ${viewMode === "horizontal" ? "py-1 mb-1" : "py-2 mb-3"}`}>
          <button
            className={`tab-btn ${activeTab === "radar" ? "active" : ""}`}
            onClick={() => setActiveTab("radar")}
            data-testid="tab-radar"
          >
            Radar de Jogo
          </button>
          <button
            className={`tab-btn ${activeTab === "gestao" ? "active" : ""}`}
            onClick={() => setActiveTab("gestao")}
            data-testid="tab-gestao"
          >
            Gestão de Banca
          </button>
          <button
            onClick={() => setViewMode(viewMode === "vertical" ? "horizontal" : "vertical")}
            className="flex items-center gap-1 px-3 border-2 border-[#D4AF37] rounded-lg text-xs font-bold transition-all"
            style={{
              background: viewMode === "horizontal" ? "rgba(212,175,55,0.2)" : "#000",
              color: viewMode === "horizontal" ? "#D4AF37" : "#fff",
              boxShadow: viewMode === "horizontal" ? "0 0 8px rgba(212,175,55,0.4)" : "none"
            }}
            data-testid="view-mode-toggle"
            title={viewMode === "vertical" ? "Mudar para Horizontal" : "Mudar para Vertical"}
          >
            {viewMode === "vertical" ? (
              <><Smartphone className="w-4 h-4" /><span className="hidden sm:inline">Vertical</span></>
            ) : (
              <><Monitor className="w-4 h-4" /><span className="hidden sm:inline">Horizontal</span></>
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className={viewMode === "horizontal" ? "flex-1 min-h-0 overflow-hidden" : ""}>
          {activeTab === "radar" && <RadarTab viewMode={viewMode} />}
          {activeTab === "gestao" && <GestaoTab viewMode={viewMode} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
