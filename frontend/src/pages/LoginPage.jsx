/**
 * Login Page for RADAR V22 / Método L.O
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, getGoogleAuthUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, User, Lock, Mail, Loader2 } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Format CPF as user types
  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCPFChange = (e) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // Register
        await authApi.register(cpf, email, password, name);
        // After register, login
        const result = await authApi.loginCPF(cpf, password);
        await login(result.user, result.subscription);
        navigate("/");
      } else {
        // Login
        const result = await authApi.loginCPF(cpf, password);
        await login(result.user, result.subscription);
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Watermark */}
      <div className="watermark-bg" />

      <div className="app-container w-full max-w-md">
        <div className="card-glass p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="logo-metodo-large mb-2">Método L.O</h1>
            <p className="text-gray-400 text-sm">RADAR V22 + GESTÃO PRO</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm" data-testid="login-error">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CPF */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="CPF"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                className="input-dark w-full pl-10 text-left"
                data-testid="cpf-input"
                required
              />
            </div>

            {/* Email (only for register) */}
            {isRegister && (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-dark w-full pl-10 text-left"
                    data-testid="email-input"
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Nome (opcional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-dark w-full pl-10 text-left"
                    data-testid="name-input"
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark w-full pl-10 pr-10 text-left"
                data-testid="password-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#00ff95] text-black font-bold rounded-lg hover:bg-[#00cc7a] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="submit-btn"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isRegister ? "CRIAR CONTA" : "ENTRAR"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-4 text-gray-500 text-sm">ou</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white text-gray-800 font-bold rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </button>

          {/* Toggle register/login */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-gray-400 hover:text-white text-sm transition-colors"
              data-testid="toggle-register-btn"
            >
              {isRegister ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
