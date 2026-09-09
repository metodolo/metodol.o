/**
 * Sinais Tab (Em Construcao) - Historico com filtro por regioes
 * Password protected. Up to 2000 numbers history with region filtering.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  VERMELHOS,
  REGIOES_MAPEADAS,
  getBgColor,
  colorizeTitle,
} from "../engine/radarEngine";

const SENHA = "13052017";
const HISTORY_KEY = "sinais_history_2k";
const RADAR_KEY = "radar_giros";

const SinaisTab = ({ viewMode = "vertical" }) => {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('sinais_auth') === 'true');
  const [senhaInput, setSenhaInput] = useState("");
  const [senhaError, setSenhaError] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
  });
  const [selectedRegions, setSelectedRegions] = useState([]);
  const painelRef = useRef(null);
  const isHorizontal = viewMode === "horizontal";
  const lastRadarLen = useRef(0);

  // Save history to localStorage + sync to radar
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    // Also write last 14 numbers to radar_giros so RadarTab picks them up
    const radarGiros = history.slice(-14);
    localStorage.setItem(RADAR_KEY, JSON.stringify(radarGiros));
  }, [history]);

  // Poll radar_giros for numbers added from RadarTab
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const radarData = JSON.parse(localStorage.getItem(RADAR_KEY) || '[]');
        if (radarData.length > lastRadarLen.current && radarData.length > 0) {
          // New numbers were added from RadarTab
          const newNums = radarData.slice(lastRadarLen.current);
          if (newNums.length > 0 && newNums.length <= 5) {
            setHistory(prev => {
              const updated = [...prev, ...newNums];
              return updated.length > 2000 ? updated.slice(-2000) : updated;
            });
          }
        }
        lastRadarLen.current = radarData.length;
      } catch { /* ignore */ }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const addNumber = (n) => {
    setHistory(prev => {
      const updated = [...prev, n];
      return updated.length > 2000 ? updated.slice(-2000) : updated;
    });
  };

  const undo = () => {
    const y = window.scrollY;
    setHistory(prev => prev.slice(0, -1));
    requestAnimationFrame(() => window.scrollTo(0, y));
  };

  const limpar = () => {
    const y = window.scrollY;
    setHistory([]);
    setSelectedRegions([]);
    localStorage.setItem(RADAR_KEY, '[]');
    requestAnimationFrame(() => window.scrollTo(0, y));
  };

  const toggleRegion = (regionName) => {
    setSelectedRegions(prev =>
      prev.includes(regionName)
        ? prev.filter(r => r !== regionName)
        : [...prev, regionName]
    );
  };

  // Get all numbers that belong to selected regions
  const highlightedNumbers = new Set();
  selectedRegions.forEach(r => {
    (REGIOES_MAPEADAS[r] || []).forEach(n => highlightedNumbers.add(n));
  });

  const hasFilter = selectedRegions.length > 0;

  // Login screen
  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-[#D4AF37] font-bold text-lg">{"\u00c1REA RESTRITA"}</div>
        <input
          type="password"
          value={senhaInput}
          onChange={e => setSenhaInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (senhaInput === SENHA) {
                setAuthenticated(true);
                sessionStorage.setItem('sinais_auth', 'true');
              } else {
                setSenhaError(true);
              }
            }
          }}
          placeholder="Digite a senha"
          className="bg-black border-2 border-[#D4AF37] rounded-lg px-4 py-3 text-white text-center text-lg focus:outline-none"
          data-testid="sinais-password"
        />
        <button
          onClick={() => {
            if (senhaInput === SENHA) {
              setAuthenticated(true);
              sessionStorage.setItem('sinais_auth', 'true');
            } else {
              setSenhaError(true);
            }
          }}
          className="bg-[rgba(212,175,55,0.2)] border-2 border-[#D4AF37] text-[#D4AF37] font-bold px-8 py-3 rounded-lg"
          data-testid="sinais-enter"
        >
          ENTRAR
        </button>
        {senhaError && <div className="text-red-500 text-sm">Senha incorreta</div>}
      </div>
    );
  }

  const keyboard = Array.from({ length: 36 }, (_, i) => i + 1);
  const compact = isHorizontal;

  // Region frequency count
  const regionCounts = {};
  Object.keys(REGIOES_MAPEADAS).forEach(r => {
    regionCounts[r] = history.filter(n => REGIOES_MAPEADAS[r].includes(n)).length;
  });

  const Keyboard = () => (
    <div className={`grid grid-cols-6 gap-[2px] bg-[rgba(17,17,17,0.9)] rounded-xl border-2 border-[#D4AF37] ${compact ? "p-1" : "p-2"}`}
      style={compact ? { gridTemplateRows: "repeat(7, 1fr)" } : {}}>
      <button
        className={`col-span-6 ${compact ? "bg-[#00ff41] text-black font-black text-base rounded cursor-pointer" : "roulette-btn green"}`}
        onClick={() => addNumber(0)}
        data-testid="btn-0"
      >0</button>
      {keyboard.map((n) => (
        <button
          key={n}
          className={compact
            ? `${VERMELHOS.includes(n) ? "bg-[#ff3131]" : "bg-[#2b2b2b]"} text-white font-black text-sm rounded cursor-pointer`
            : `roulette-btn ${VERMELHOS.includes(n) ? "red" : "black"}`
          }
          onClick={() => addNumber(n)}
          data-testid={`btn-${n}`}
        >{n}</button>
      ))}
    </div>
  );

  const ActionButtons = () => (
    <div className="flex gap-2">
      <button
        onClick={undo}
        className={`flex-1 bg-black text-white font-bold rounded-lg border-2 border-[#D4AF37] hover:bg-[#1a1a1a] transition-colors ${compact ? "py-2 text-sm" : "py-4"}`}
        data-testid="btn-undo"
      >CORRIGIR</button>
      <button
        onClick={limpar}
        className={`flex-1 bg-black text-white font-bold rounded-lg border-2 border-[#D4AF37] hover:bg-[#1a1a1a] transition-colors ${compact ? "py-2 text-sm" : "py-4"}`}
        data-testid="btn-clear"
      >LIMPAR</button>
    </div>
  );

  const regioesLabel = "REGI" + "\u00d5" + "ES";
  const historicoLabel = "HIST" + "\u00d3" + "RICO";
  const placeholderText = "Clique nos n" + "\u00fa" + "meros para adicionar";

  const RegionsFilter = () => (
    <div className={`card-glass ${compact ? "!p-2" : ""}`}>
      <span className="label-accent" style={{ color: '#fff', borderColor: '#D4AF37', fontSize: compact ? '0.7rem' : '0.9rem' }}>
        {regioesLabel} {hasFilter && `(${selectedRegions.join(', ')})`}
      </span>
      <div className="grid grid-cols-3 gap-1 mt-2">
        {Object.entries(REGIOES_MAPEADAS).map(([name, nums]) => {
          const isSelected = selectedRegions.includes(name);
          const count = regionCounts[name] || 0;
          return (
            <button
              key={name}
              onClick={() => toggleRegion(name)}
              className={`rounded-lg text-center border-2 transition-all ${compact ? "p-1" : "p-2"} ${
                isSelected
                  ? "border-[#D4AF37] bg-[rgba(212,175,55,0.2)]"
                  : "border-[#333] bg-[rgba(26,26,26,0.6)] hover:border-[#555]"
              }`}
              data-testid={`region-${name}`}
            >
              <span className={`font-bold ${compact ? "text-xs" : "text-sm"}`}>
                {colorizeTitle(name).map((part, i) => (
                  <span key={i} className={isSelected ? "text-[#D4AF37]" : part.color === "red" ? "txt-red" : part.color === "green" ? "txt-green" : "txt-white"}>
                    {part.text}
                  </span>
                ))}
              </span>
              <br />
              <small className={`${isSelected ? "text-[#D4AF37]" : "text-gray-400"} ${compact ? "text-xs" : ""}`}>{count}x</small>
            </button>
          );
        })}
      </div>
      {hasFilter && (
        <button
          onClick={() => setSelectedRegions([])}
          className="w-full mt-2 py-1 text-xs text-gray-400 hover:text-white border border-[#333] rounded-lg hover:border-[#555] transition-colors"
          data-testid="clear-filter"
        >
          LIMPAR FILTRO
        </button>
      )}
    </div>
  );

  const HistoryPanel = () => (
    <div className={`card-glass ${compact ? "!p-2" : ""}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="label-accent" style={{ margin: 0, color: '#fff', borderColor: '#D4AF37', fontSize: compact ? '0.7rem' : '0.9rem' }}>
          {historicoLabel}
        </span>
        <span className="bg-[#000] text-white px-2 py-0.5 rounded-lg font-bold text-xs border-2 border-[#D4AF37]" data-testid="history-counter">
          {history.length} / 2000
        </span>
      </div>
      <div
        ref={painelRef}
        className="flex flex-row flex-wrap gap-1 bg-[rgba(17,17,17,0.5)] border border-[#444] rounded-xl p-2 max-h-[500px] overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 #111' }}
        data-testid="history-panel"
      >
        {history.length === 0 ? (
          <div className="w-full text-center text-gray-500 py-8">
            {placeholderText}
          </div>
        ) : (
          [...history].reverse().map((n, idx) => {
            const isInRegion = hasFilter && highlightedNumbers.has(n);
            const isFaded = hasFilter && !isInRegion;
            return (
              <div
                key={idx}
                className="inline-flex items-center justify-center rounded-full text-white font-bold transition-all"
                style={{
                  background: getBgColor(n),
                  width: compact ? 30 : 36,
                  height: compact ? 30 : 36,
                  fontSize: compact ? '0.7rem' : '0.8rem',
                  opacity: isFaded ? 0.2 : 1,
                  border: isInRegion ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: isInRegion ? '0 0 8px rgba(212,175,55,0.5)' : 'none',
                }}
                data-testid={`history-num-${idx}`}
              >
                {n}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // --- HORIZONTAL LAYOUT ---
  if (isHorizontal) {
    return (
      <div className="flex gap-2 h-full min-h-0 overflow-hidden" data-testid="sinais-tab">
        <div className="flex flex-col gap-1 shrink-0 min-h-0" style={{ width: "40%" }}>
          <Keyboard />
          <ActionButtons />
        </div>
        <div className="flex flex-col gap-1 min-h-0 overflow-y-auto" style={{ flex: 1, minWidth: 0, scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 #111' }}>
          <RegionsFilter />
          <HistoryPanel />
        </div>
      </div>
    );
  }

  // --- VERTICAL LAYOUT ---
  return (
    <div className="space-y-3" data-testid="sinais-tab">
      <Keyboard />
      <ActionButtons />
      <RegionsFilter />
      <HistoryPanel />
    </div>
  );
};

export default SinaisTab;
