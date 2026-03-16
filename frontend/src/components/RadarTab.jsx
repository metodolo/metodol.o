/**
 * Radar Tab Component - Main game radar
 * Faithfully replicates the original HTML logic
 */
import React, { useState, useEffect, useRef } from "react";
import {
  VERMELHOS,
  calculateTerminalWeights,
  calculateRegionFrequencies,
  getStrongestRegion,
  isStrongestRegion,
  countColors,
  getTendency,
  getTerminalFamily,
  getDozen,
  getColumn,
  getSector,
  getParity,
  getHighLow,
  getBgColor,
  colorizeTitle,
  REGIOES_MAPEADAS,
} from "../engine/radarEngine";

const STORAGE_KEY = "radar_giros";

// Initialize state from localStorage
const getInitialGiros = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading giros:", e);
  }
  return [];
};

const RadarTab = ({ viewMode = "vertical" }) => {
  const [giros, setGiros] = useState(getInitialGiros);
  const [limiteGiros, setLimiteGiros] = useState(14);
  const [terminalSelecionado, setTerminalSelecionado] = useState(null);
  const painelRef = useRef(null);
  const isHorizontal = viewMode === "horizontal";

  // Save giros to localStorage when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(giros));
  }, [giros]);

  // Scroll to end when giros change
  useEffect(() => {
    if (painelRef.current) {
      painelRef.current.scrollLeft = painelRef.current.scrollWidth;
    }
  }, [giros]);

  // Add number
  const addNumber = (n) => {
    setGiros((prev) => {
      const newGiros = [...prev, n];
      if (newGiros.length > limiteGiros) {
        return newGiros.slice(-limiteGiros);
      }
      return newGiros;
    });
  };

  // Undo last
  const undo = () => {
    setGiros((prev) => prev.slice(0, -1));
  };

  // Clear all
  const limpar = () => {
    setGiros([]);
    setTerminalSelecionado(null);
  };

  // Change limit
  const setLimite = (valor) => {
    setLimiteGiros(valor);
    setGiros((prev) => {
      if (prev.length > valor) {
        return prev.slice(-valor);
      }
      return prev;
    });
  };

  // Calculate data
  const terminalWeights = calculateTerminalWeights(giros);
  const regionFreqs = calculateRegionFrequencies(giros);
  const strongestRegion = getStrongestRegion(regionFreqs);
  const { red, black } = countColors(giros);
  const tendency = getTendency(red, black);

  // Determine active terminal
  const alvoFinal = terminalSelecionado !== null ? terminalSelecionado : (terminalWeights[0]?.terminal ?? null);
  const terminalFamily = alvoFinal !== null ? getTerminalFamily(alvoFinal) : [];

  // Generate keyboard
  const keyboard = [];
  for (let i = 1; i <= 36; i++) {
    keyboard.push(i);
  }

  // --- Shared sub-components ---

  const CounterHeader = ({ compact }) => (
    <div className={`flex justify-between items-center bg-[rgba(17,17,17,0.8)] rounded-xl border-2 border-[#D4AF37] gap-2 ${compact ? "p-2" : "p-4"}`}>
      <div className="flex-1 text-center">
        <small className="text-gray-400 text-xs">VERM.</small>
        <br />
        <span className={`font-black neon-red ${compact ? "text-2xl" : "text-4xl"}`} data-testid="count-red">{red}</span>
      </div>
      <div className="flex-[2] text-center">
        <span className={compact ? "logo-metodo text-xl" : "logo-metodo"} style={compact ? { fontSize: "1.2rem" } : {}}>Método L.O</span>
      </div>
      <div className="flex-1 text-center">
        <small className="text-gray-400 text-xs">PRETO</small>
        <br />
        <span className={`font-black neon-black ${compact ? "text-2xl" : "text-4xl"}`} data-testid="count-black">{black}</span>
      </div>
    </div>
  );

  const Keyboard = ({ compact }) => (
    <div className={`grid grid-cols-6 bg-[rgba(17,17,17,0.9)] rounded-xl border-2 border-[#D4AF37] ${compact ? "p-1 flex-1 gap-[2px]" : "p-2 gap-1"}`}
      style={compact ? { gridTemplateRows: "repeat(7, 1fr)" } : {}}
    >
      <button
        className={`col-span-6 ${compact
          ? "bg-[#00ff41] text-black font-black text-base rounded cursor-pointer"
          : "roulette-btn green"
        }`}
        onClick={() => addNumber(0)}
        data-testid="btn-0"
      >
        0
      </button>
      {keyboard.map((n) => (
        <button
          key={n}
          className={compact
            ? `${VERMELHOS.includes(n) ? "bg-[#ff3131]" : "bg-[#2b2b2b]"} text-white font-black text-sm rounded cursor-pointer`
            : `roulette-btn ${VERMELHOS.includes(n) ? "red" : "black"}`
          }
          onClick={() => addNumber(n)}
          data-testid={`btn-${n}`}
        >
          {n}
        </button>
      ))}
    </div>
  );

  const ActionButtons = ({ compact }) => (
    <div className="flex gap-2">
      <button
        onClick={undo}
        className={`flex-1 bg-black text-white font-bold rounded-lg border-2 border-[#D4AF37] hover:bg-[#1a1a1a] transition-colors ${compact ? "py-2 text-sm" : "py-4"}`}
        data-testid="btn-undo"
      >
        CORRIGIR
      </button>
      <button
        onClick={limpar}
        className={`flex-1 bg-black text-white font-bold rounded-lg border-2 border-[#D4AF37] hover:bg-[#1a1a1a] transition-colors ${compact ? "py-2 text-sm" : "py-4"}`}
        data-testid="btn-clear"
      >
        LIMPAR
      </button>
    </div>
  );

  const HistoryCard = ({ compact }) => (
    <div className={`card-glass ${compact ? "!p-2" : ""}`}>
      <div className="flex gap-2 mb-2">
        <button
          className={`ciclo-btn ${limiteGiros === 14 ? "active" : ""} ${compact ? "!py-1 !text-xs" : ""}`}
          onClick={() => setLimite(14)}
          data-testid="btn-14-giros"
        >
          14 GIROS
        </button>
        <button
          className={`ciclo-btn ${limiteGiros === 50 ? "active" : ""} ${compact ? "!py-1 !text-xs" : ""}`}
          onClick={() => setLimite(50)}
          data-testid="btn-50-giros"
        >
          50 GIROS
        </button>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="label-accent" style={{ margin: 0, color: '#fff', borderColor: '#D4AF37', fontSize: compact ? '0.7rem' : '0.9rem' }}>HISTÓRICO</span>
        <span className="bg-[#000] text-white px-2 py-0.5 rounded-lg font-bold text-xs border-2 border-[#D4AF37]" data-testid="cycle-counter">
          {giros.length} / {limiteGiros}
        </span>
      </div>
      <div
        ref={painelRef}
        className={`flex gap-2 overflow-x-auto bg-[rgba(17,17,17,0.5)] border border-[#444] rounded-xl p-2 ${compact ? "min-h-[60px]" : "min-h-[100px]"}`}
        data-testid="giros-panel"
      >
        {giros.map((n, idx) => {
          const dozen = getDozen(n);
          const column = getColumn(n);
          const parity = getParity(n);
          const highLow = getHighLow(n);
          return (
            <div key={idx} className={`flex flex-col items-center gap-0.5 ${compact ? "min-w-[55px]" : "min-w-[75px]"}`}>
              <div className="mini-ball" style={{ background: getBgColor(n), minWidth: compact ? 30 : 40, height: compact ? 30 : 40, fontSize: compact ? '0.8rem' : '1rem' }}>
                {n}
              </div>
              <div className="flex w-full gap-0.5">
                <span className={`tag ${dozen.className}`} style={{ fontSize: compact ? '0.55rem' : undefined }}>{dozen.text}</span>
                <span className={`tag ${column.className}`} style={{ fontSize: compact ? '0.55rem' : undefined }}>{column.text}</span>
              </div>
              <span className={`tag ${parity.className}`} style={{ fontSize: compact ? '0.55rem' : undefined }}>{parity.text}</span>
              <span className={`tag ${highLow.className}`} style={{ fontSize: compact ? '0.55rem' : undefined }}>{highLow.text}</span>
            </div>
          );
        })}
        {giros.length === 0 && (
          <div className={`w-full text-center text-gray-500 ${compact ? "py-3 text-xs" : "py-8"}`}>
            Clique nos números para adicionar
          </div>
        )}
      </div>
    </div>
  );

  const RegionsCard = ({ compact }) => (
    <div className={`card-glass ${compact ? "!p-2" : ""}`}>
      <span className="label-accent" style={{ color: '#fff', borderColor: '#D4AF37', fontSize: compact ? '0.7rem' : '0.9rem' }}>
        REGIÕES{strongestRegion ? ` - FOCO: ` : ""}
        {strongestRegion && (
          <span>
            {colorizeTitle(strongestRegion.name).map((part, idx) => (
              <span key={idx} className={part.color === "red" ? "txt-red" : part.color === "green" ? "txt-green" : "txt-white"}>
                {part.text}
              </span>
            ))}
          </span>
        )}
      </span>
      <div className={`grid grid-cols-3 gap-1`}>
        {Object.entries(regionFreqs).map(([r, count]) => {
          const isStrong = isStrongestRegion(regionFreqs, r) && count > 0;
          return (
            <div
              key={r}
              className={`bg-[rgba(26,26,26,0.6)] rounded-lg text-center border ${isStrong ? "border-[#D4AF37]" : "border-[#333]"} ${compact ? "p-1" : "p-2"}`}
            >
              <span className={`font-bold ${compact ? "text-xs" : ""}`}>
                {colorizeTitle(r).map((part, idx) => (
                  <span key={idx} className={part.color === "red" ? "txt-red" : part.color === "green" ? "txt-green" : "txt-white"}>
                    {part.text}
                  </span>
                ))}
              </span>
              <br />
              <small className={`text-white ${compact ? "text-xs" : ""}`}>{count}X</small>
            </div>
          );
        })}
      </div>
      {strongestRegion && (
        <div className={`mt-2 flex flex-wrap justify-center gap-1`} data-testid="region-targets">
          {strongestRegion.numbers.map((num) => {
            const followsColor =
              (tendency === "V" && VERMELHOS.includes(num)) ||
              (tendency === "P" && num !== 0 && !VERMELHOS.includes(num));
            return (
              <div
                key={num}
                className={`mini-ball ${followsColor ? "tendencia-ativa" : ""}`}
                style={{ background: getBgColor(num), minWidth: compact ? 28 : 40, height: compact ? 28 : 40, fontSize: compact ? '0.7rem' : '1rem' }}
              >
                {num}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const OcultosCard = ({ compact }) => (
    <div className={`card-glass ${compact ? "!p-2" : ""}`}>
      <span className="label-accent" style={{ color: '#fff', borderColor: '#D4AF37', fontSize: compact ? '0.7rem' : '0.9rem' }}>RADAR DE OCULTOS</span>
      <div className={`grid grid-cols-3 gap-1`} data-testid="terminal-weights">
        {terminalWeights.slice(0, 9).map(({ terminal, peso }) => {
          if (peso === 0) return null;
          const isSelected = terminal === alvoFinal;
          return (
            <div
              key={terminal}
              className={`soma-item text-center rounded-lg border border-[#333] ${isSelected ? "soma-selecionada" : ""} ${compact ? "p-1" : "p-2"}`}
              style={{ background: getBgColor(terminal) }}
              onClick={() => setTerminalSelecionado(terminal)}
              data-testid={`terminal-${terminal}`}
            >
              <span className={`font-bold ${compact ? "text-sm" : "text-lg"}`}>{terminal}</span>
              <br />
              <small className={`text-white ${compact ? "text-xs" : ""}`}>{peso}X</small>
            </div>
          );
        })}
      </div>
    </div>
  );

  const FamilyCard = ({ compact, fillSpace }) => {
    const hasData = alvoFinal !== null && terminalFamily.length > 0;
    if (!hasData && !fillSpace) return null;
    return (
      <div className={`card-glass border-2 border-[#D4AF37] text-center ${compact ? "!p-2" : ""} ${fillSpace ? "flex-1 flex flex-col justify-center" : ""}`} data-testid="suggestion-card">
        {hasData ? (
          <>
            <span className={`text-white font-bold ${compact ? "text-xs" : ""}`}>
              FAMÍLIA: <span data-testid="family-target">{alvoFinal}</span>
            </span>
            <div className={`flex flex-wrap justify-center gap-1 mt-1`}>
              {terminalFamily.map((num) => {
                const isGold = strongestRegion?.numbers.includes(num);
                return (
                  <div
                    key={num}
                    className={`mini-ball ${isGold ? "gold-confluencia" : ""}`}
                    style={{ background: getBgColor(num), minWidth: compact ? 28 : 40, height: compact ? 28 : 40, fontSize: compact ? '0.7rem' : '1rem' }}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <span className="text-gray-600 text-xs">Clique nos números para ver a família</span>
        )}
      </div>
    );
  };

  // --- HORIZONTAL LAYOUT ---
  if (isHorizontal) {
    return (
      <div className="flex gap-2 h-full min-h-0 overflow-hidden" data-testid="radar-tab">
        {/* Left Column */}
        <div className="flex flex-col gap-1 shrink-0 min-h-0" style={{ width: "40%" }}>
          <CounterHeader compact />
          <div className="flex-1 min-h-0 grid grid-cols-6 gap-[2px] bg-[rgba(17,17,17,0.9)] rounded-xl border-2 border-[#D4AF37] p-1"
            style={{ gridTemplateRows: "repeat(7, 1fr)" }}>
            <button
              className="col-span-6 bg-[#00ff41] text-black font-black text-base rounded cursor-pointer"
              onClick={() => addNumber(0)}
              data-testid="btn-0"
            >0</button>
            {keyboard.map((n) => (
              <button
                key={n}
                className={`${VERMELHOS.includes(n) ? "bg-[#ff3131]" : "bg-[#2b2b2b]"} text-white font-black text-sm rounded cursor-pointer`}
                onClick={() => addNumber(n)}
                data-testid={`btn-${n}`}
              >{n}</button>
            ))}
          </div>
          <ActionButtons compact />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-1 min-h-0 overflow-y-auto hide-scrollbar" style={{ flex: 1, minWidth: 0 }}>
          <HistoryCard compact />
          <RegionsCard compact />
          <OcultosCard compact />
          <FamilyCard compact fillSpace />
        </div>
      </div>
    );
  }

  // --- VERTICAL LAYOUT (original) ---
  return (
    <div className="space-y-3" data-testid="radar-tab">
      <CounterHeader compact={false} />
      <Keyboard compact={false} />
      <HistoryCard compact={false} />
      <RegionsCard compact={false} />
      <OcultosCard compact={false} />
      <FamilyCard compact={false} />
      <ActionButtons compact={false} />
    </div>
  );
};

export default RadarTab;
