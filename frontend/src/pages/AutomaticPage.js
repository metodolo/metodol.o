/**
 * Automatic Mode Page (Stub - Coming Soon)
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wifi, Lock, Settings } from "lucide-react";

const AutomaticPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-10">
      {/* Watermark */}
      <div className="watermark-bg" />

      <div className="app-container max-w-[600px] mx-auto p-4">
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
            <Wifi className="w-6 h-6 text-[#ccff00]" />
            Modo Automático
          </h1>
        </div>

        {/* Coming soon card */}
        <div className="card-glass text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#ccff00]/10 flex items-center justify-center">
            <Lock className="w-10 h-10 text-[#ccff00]" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-[#ccff00]">EM BREVE</h2>
          
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            O modo automático permitirá conectar a uma API externa para receber os números em tempo real, 
            sem precisar digitar manualmente.
          </p>

          {/* Disabled connect button */}
          <button
            disabled
            className="px-8 py-4 bg-[#333] text-gray-500 font-bold rounded-lg cursor-not-allowed flex items-center gap-2 mx-auto"
            data-testid="connect-api-btn"
          >
            <Settings className="w-5 h-5" />
            Conectar API
          </button>

          {/* Features preview */}
          <div className="mt-12 grid gap-4 text-left max-w-md mx-auto">
            <div className="flex items-start gap-3 p-3 bg-[rgba(17,17,17,0.5)] rounded-lg border border-[#333]">
              <div className="w-8 h-8 rounded bg-[#00ff95]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#00ff95]">1</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Conexão em Tempo Real</h4>
                <p className="text-xs text-gray-500">Receba os números automaticamente via WebSocket ou polling</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-[rgba(17,17,17,0.5)] rounded-lg border border-[#333]">
              <div className="w-8 h-8 rounded bg-[#00ff95]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#00ff95]">2</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Análise Automática</h4>
                <p className="text-xs text-gray-500">O radar processa cada número instantaneamente</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-[rgba(17,17,17,0.5)] rounded-lg border border-[#333]">
              <div className="w-8 h-8 rounded bg-[#00ff95]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#00ff95]">3</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Histórico Salvo</h4>
                <p className="text-xs text-gray-500">Todos os dados salvos para análise posterior</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomaticPage;
