/**
 * Change Password Modal Component
 */
import React, { useState } from "react";
import { Lock, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const ChangePasswordModal = ({ onSuccess }) => {
  const { clearMustChangePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (currentPassword === newPassword) {
      setError("A nova senha deve ser diferente da atual");
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      clearMustChangePassword();
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border-2 border-[#D4AF37] rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl font-bold text-white">Alterar Senha</h2>
          <p className="text-gray-400 text-sm mt-2">
            Por segurança, você precisa criar uma nova senha para continuar.
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-green-400 font-bold">Senha alterada com sucesso!</p>
            <p className="text-gray-400 text-sm mt-2">Redirecionando...</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Senha Atual</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none pr-12"
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nova Senha</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none pr-12"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirmar Nova Senha</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none pr-12"
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#c9a030] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              data-testid="btn-change-password"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Alterar Senha
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
