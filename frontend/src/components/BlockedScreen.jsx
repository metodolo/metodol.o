/**
 * Blocked Screen - shown when account is deactivated or subscription expired
 */
import React from "react";
import { Lock } from "lucide-react";

const BlockedScreen = ({ onRetry }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" data-testid="blocked-screen">
      <div className="watermark-bg" />
      <div className="card-glass max-w-md w-full text-center p-8 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-[#D4AF37] flex items-center justify-center bg-[rgba(212,175,55,0.1)]">
            <Lock className="w-10 h-10 text-[#D4AF37]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#D4AF37] mb-3" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Acesso Expirado
        </h1>

        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
          Seu período de acesso ao <strong className="text-[#D4AF37]">Método L.O</strong> chegou ao fim.
          Para continuar utilizando o sistema, renove sua assinatura.
        </p>

        <div className="space-y-3">
          <a
            href="https://lastlink.com/p/C21B6FA42/checkout-payment/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 px-6 rounded-lg font-bold text-black text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #f5d670)',
              boxShadow: '0 0 15px rgba(212,175,55,0.4)',
            }}
            data-testid="renew-btn"
          >
            RENOVAR ASSINATURA
          </a>

          <button
            onClick={onRetry}
            className="w-full py-2 px-6 rounded-lg font-bold text-gray-400 text-xs border border-[#333] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
            data-testid="retry-login-btn"
          >
            Tentar novamente
          </button>
        </div>

        <p className="text-gray-600 text-xs mt-6">
          Em caso de dúvidas, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
};

export default BlockedScreen;
