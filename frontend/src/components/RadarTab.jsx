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

// Custom number data from user
const NUMBER_INFO = {
  0: { parity: '', highLow: '', refs: '5/1/4/8' },
  1: { parity: 'ÍMPAR', highLow: 'BAIXO', refs: '2/6' },
  2: { parity: 'PAR', highLow: 'BAIXO', refs: '1/3/7' },
  3: { parity: 'ÍMPAR', highLow: 'BAIXO', refs: '2/4/8' },
  4: { parity: 'PAR', highLow: 'BAIXO', refs: '1/3/8' },
  5: { parity: 'ÍMPAR', highLow: 'BAIXO', refs: '1/2/6' },
  6: { parity: 'PAR', highLow: 'BAIXO', refs: '1/5/7/9' },
  7: { parity: 'ÍMPAR', highLow: 'BAIXO', refs: '1/2/6/7' },
  8: { parity: 'PAR', highLow: 'BAIXO', refs: '1/3/5' },
  9: { parity: 'ÍMPAR', highLow: 'BAIXO', refs: '4/2' },
  10: { parity: 'PAR', highLow: 'BAIXO', refs: '5/1' },
  11: { parity: 'ÍMPAR', highLow: 'BAIXO', refs: '3/9' },
  12: { parity: 'PAR', highLow: 'BAIXO', refs: '1/2/6/8' },
  13: { parity: 'ÍMPAR', highLow: 'BAIXO', refs: '3/5/9' },
  14: { parity: 'PAR', highLow: 'BAIXO', refs: '4/2' },
  15: { parity: 'ÍMPAR', highLow: 'BAIXO', refs: '1/5/8' },
  16: { parity: 'PAR', highLow: 'BAIXO', refs: '6/2' },
  17: { parity: 'ÍMPAR', highLow: 'BAIXO', refs: '1/3/7' },
  18: { parity: 'PAR', highLow: 'BAIXO', refs: '2/4/7' },
  19: { parity: 'ÍMPAR', highLow: 'ALTO', refs: '4/6' },
  20: { parity: 'PAR', highLow: 'ALTO', refs: '1/3/5' },
  21: { parity: 'ÍMPAR', highLow: 'ALTO', refs: '2/4' },
  22: { parity: 'PAR', highLow: 'ALTO', refs: '7/9' },
  23: { parity: 'ÍMPAR', highLow: 'ALTO', refs: '1/8' },
  24: { parity: 'PAR', highLow: 'ALTO', refs: '5/7' },
  25: { parity: 'ÍMPAR', highLow: 'ALTO', refs: '2/6/8' },
  26: { parity: 'PAR', highLow: 'ALTO', refs: '3/0' },
  27: { parity: 'ÍMPAR', highLow: 'ALTO', refs: '2/4/6' },
  28: { parity: 'PAR', highLow: 'ALTO', refs: '1/3/7' },
  29: { parity: 'ÍMPAR', highLow: 'ALTO', refs: '7/9' },
  30: { parity: 'PAR', highLow: 'ALTO', refs: '2/8' },
  31: { parity: 'ÍMPAR', highLow: 'ALTO', refs: '3/5/9' },
  32: { parity: 'PAR', highLow: 'ALTO', refs: '4/6/0' },
  33: { parity: 'ÍMPAR', highLow: 'ALTO', refs: '1/5/7' },
  34: { parity: 'PAR', highLow: 'ALTO', refs: '6/8' },
  35: { parity: 'ÍMPAR', highLow: 'ALTO', refs: '1/3' },
  36: { parity: 'PAR', highLow: 'ALTO', refs: '2/4' },
};

// Junction data from user's table
const JUNCAO_DATA = {
  0: [23, 32, 19, 26, 22, 5, 1, 8, 4],
  1: [33, 24, 20, 11, 6, 2],
  2: [25, 21, 12, 34, 30, 7, 3, 1, 10],
  3: [26, 35, 13, 31, 8, 2, 4, 22, 20, 11],
  4: [21, 12, 19, 10, 30, 3, 1, 8],
  5: [10, 1, 24, 33, 20, 28, 6, 2],
  6: [7, 1, 34, 27, 18, 16, 23, 32, 9, 5, 10],
  7: [11, 2, 29, 28, 24, 34, 7, 1, 6],
  8: [3, 30, 21, 12, 23, 32, 3, 5, 1, 14, 10],
  9: [4, 2, 22, 13, 31, 20, 11],
  10: [1, 5, 23, 32, 10],
  11: [3, 30, 36, 9],
  12: [35, 8, 2, 11, 20, 1, 10, 28, 24, 19, 17],
  13: [9, 3, 5, 27, 36, 30, 14],
  14: [2, 4, 20, 11, 22, 13, 31],
  15: [1, 5, 8, 10, 19, 23, 32],
  16: [6, 2, 24, 33, 20, 11],
  17: [1, 7, 3, 34, 25, 21, 12, 30, 10],
  18: [4, 2, 7, 22, 31, 13, 29, 20, 11],
  19: [6, 4, 15, 33, 22],
  20: [1, 5, 3, 10, 21, 12, 23, 32, 14],
  21: [2, 4, 11, 20, 31, 13, 22],
  22: [7, 9, 18, 29],
  23: [8, 1, 10, 19],
  24: [5, 7, 16],
  25: [2, 8, 6, 17, 24, 35, 20, 11, 33],
  26: [0, 3, 30],
  27: [6, 4, 2, 24, 33, 31, 13, 22, 15, 20, 11],
  28: [7, 3, 1, 34, 21, 12, 30, 10, 25],
  29: [7, 9, 18, 29],
  30: [8, 2, 11, 35, 20],
  31: [9, 5, 3, 14, 27, 36, 30],
  32: [0, 6, 4, 15, 33, 22],
  33: [1, 7, 5, 34, 23, 32, 16, 10],
  34: [8, 6, 17, 33],
  35: [3, 1, 30, 12, 21, 10],
  36: [4, 2, 22, 20, 11, 13, 31],
};

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

  // Find repeated numbers - mark the LAST occurrence of each repeated number
  const getRepeatedIndices = () => {
    const reversed = [...giros].reverse();
    const seen = new Set();
    const repeated = new Set();
    // First pass: find which numbers are repeated
    for (const n of reversed) {
      if (seen.has(n)) repeated.add(n);
      seen.add(n);
    }
    // Second pass: mark only the first occurrence (newest) of each repeated number
    const markedNums = new Set();
    const blinkSet = new Set();
    reversed.forEach((n, idx) => {
      if (repeated.has(n) && !markedNums.has(n)) {
        blinkSet.add(idx);
        markedNums.add(n);
      }
    });
    return blinkSet;
  };

  // Get list of repeated numbers (unique, in order of first repeat)
  const getRepeatedNumbers = () => {
    const seen = new Set();
    const repeated = [];
    const added = new Set();
    for (const n of giros) {
      if (seen.has(n) && !added.has(n)) {
        repeated.push(n);
        added.add(n);
      }
      seen.add(n);
    }
    return repeated;
  };

  const HistoryCard = ({ compact }) => {
    const blinkIndices = getRepeatedIndices();
    return (
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
        className={`flex flex-row-reverse overflow-x-auto bg-[rgba(17,17,17,0.5)] border border-[#444] rounded-xl p-2 ${compact ? "min-h-[60px]" : "min-h-[100px]"}`}
        data-testid="giros-panel"
      >
        {[...giros].reverse().map((n, idx) => {
          const parity = getParity(n);
          const highLow = getHighLow(n);
          const info = NUMBER_INFO[n] || {};
          const shouldBlink = blinkIndices.has(idx);
          return (
            <div key={idx} className={`flex flex-col items-center gap-0.5 ${compact ? "shrink-0" : "shrink-0"}`} style={compact ? { width: `calc(100% / ${limiteGiros})`, padding: '0 1px' } : { minWidth: '75px', padding: '0 2px' }}>
              <div className={`mini-ball ${shouldBlink ? 'blink-gold' : ''}`} style={{ background: getBgColor(n), minWidth: compact ? 30 : 40, height: compact ? 30 : 40, fontSize: compact ? '0.8rem' : '1rem' }}>
                {n}
              </div>
              <span className={`tag ${parity.className}`} style={{ fontSize: compact ? '0.5rem' : '0.65rem' }}>{parity.text}</span>
              <span className={`tag ${highLow.className}`} style={{ fontSize: compact ? '0.5rem' : '0.65rem' }}>{highLow.text}</span>
              {info.refs && (
                <span className="tag" style={{ fontSize: compact ? '0.6rem' : '0.8rem', color: '#fff', border: '1px solid #D4AF37', fontWeight: 800 }}>{info.refs}</span>
              )}
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
  };

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
            <span className={`text-white font-bold ${compact ? "text-sm" : ""}`}>
              FAMÍLIA: <span data-testid="family-target">{alvoFinal}</span>
            </span>
            <div className={`flex flex-wrap justify-center gap-2 mt-2`}>
              {terminalFamily.map((num) => {
                const isGold = strongestRegion?.numbers.includes(num);
                return (
                  <div
                    key={num}
                    className={`mini-ball ${isGold ? "gold-confluencia" : ""}`}
                    style={{ background: getBgColor(num), minWidth: compact ? 42 : 40, height: compact ? 42 : 40, fontSize: compact ? '1rem' : '1rem' }}
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

  const JuncaoCard = ({ compact }) => {
    const repeatedNums = getRepeatedNumbers();
    const regionNums = strongestRegion?.numbers || [];
    return (
      <div className={`card-glass ${compact ? "!p-2 flex-1 flex flex-col" : ""}`} data-testid="juncao-card">
        <span className="label-accent" style={{ color: '#fff', borderColor: '#D4AF37', fontSize: compact ? '0.7rem' : '0.9rem' }}>JUNÇÃO DOS NÚMEROS</span>
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'auto', scrollbarColor: '#D4AF37 #222' }}>
          {repeatedNums.length > 0 ? repeatedNums.map((num) => {
            const juncao = JUNCAO_DATA[num] || [];
            return (
              <div key={num} className={`${compact ? "py-1" : "py-2"} border-b border-[#333]`}>
                <span className="font-bold text-[#D4AF37] block" style={{ fontSize: compact ? '0.65rem' : '0.85rem', marginBottom: compact ? 2 : 4 }}>
                  {num} Junção:
                </span>
                <div className="flex flex-wrap gap-1">
                  {juncao.map((jn, i) => {
                    const isInRegion = regionNums.includes(jn);
                    return (
                      <div
                        key={i}
                        className={`mini-ball ${isInRegion ? "gold-confluencia" : ""}`}
                        style={{
                          background: getBgColor(jn),
                          minWidth: compact ? 26 : 34,
                          height: compact ? 26 : 34,
                          fontSize: compact ? '0.6rem' : '0.75rem',
                          border: isInRegion ? '2px solid #D4AF37' : '2px solid #fff',
                          boxShadow: isInRegion ? '0 0 8px rgba(212,175,55,0.6)' : 'none',
                        }}
                      >
                        {jn}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }) : (
            <div className={`text-center text-gray-600 ${compact ? "py-2 text-xs" : "py-4 text-sm"}`}>
              Números repetidos aparecerão aqui
            </div>
          )}
        </div>
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
        <div className="flex flex-col gap-1 min-h-0" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div className="shrink-0"><HistoryCard compact /></div>
          <div className="shrink min-h-0 overflow-hidden"><RegionsCard compact /></div>
          <div className="shrink min-h-0 overflow-hidden"><OcultosCard compact /></div>
          {/* Family + Juncao side by side - fills remaining space */}
          <div className="flex gap-1 flex-1 min-h-[100px]">
            <FamilyCard compact fillSpace />
            <JuncaoCard compact />
          </div>
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
      <JuncaoCard compact={false} />
      <ActionButtons compact={false} />
    </div>
  );
};

export default RadarTab;
