/**
 * Sinais Tab (Em Construção) - Independent tracker synced with RadarTab
 * Password protected. Shares giros with RadarTab via localStorage.
 * Shows reference number analysis by opposite color.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  VERMELHOS,
  countColors,
  getParity,
  getHighLow,
  getBgColor,
} from "../engine/radarEngine";

const SENHA = "13052017";
const STORAGE_KEY = "radar_giros";

const NUMBER_INFO = {
  0: { refs: '5/1/4/8' }, 1: { refs: '2/6' }, 2: { refs: '1/3/7' }, 3: { refs: '2/4/8' },
  4: { refs: '1/3/8' }, 5: { refs: '1/2/6' }, 6: { refs: '1/5/7/9' }, 7: { refs: '1/2/6/7' },
  8: { refs: '1/3/5' }, 9: { refs: '4/2' }, 10: { refs: '5/1' }, 11: { refs: '3/9' },
  12: { refs: '1/2/6/8' }, 13: { refs: '3/5/9' }, 14: { refs: '4/2' }, 15: { refs: '1/5/8' },
  16: { refs: '6/2' }, 17: { refs: '1/3/7' }, 18: { refs: '2/4/7' }, 19: { refs: '4/6' },
  20: { refs: '1/3/5' }, 21: { refs: '2/4' }, 22: { refs: '7/9' }, 23: { refs: '1/8' },
  24: { refs: '5/7' }, 25: { refs: '2/6/8' }, 26: { refs: '3/0' }, 27: { refs: '2/4/6' },
  28: { refs: '1/3/7' }, 29: { refs: '7/9' }, 30: { refs: '2/8' }, 31: { refs: '3/5/9' },
  32: { refs: '4/6/0' }, 33: { refs: '1/5/7' }, 34: { refs: '6/8' }, 35: { refs: '1/3' },
  36: { refs: '2/4' },
};

const SinaisTab = ({ viewMode = "vertical" }) => {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('sinais_auth') === 'true');
  const [senhaInput, setSenhaInput] = useState("");
  const [senhaError, setSenhaError] = useState(false);
  const [giros, setGiros] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [limiteGiros, setLimiteGiros] = useState(14);
  const painelRef = useRef(null);
  const isHorizontal = viewMode === "horizontal";

  const handleLogin = () => {
    if (senhaInput === SENHA) {
      setAuthenticated(true);
      sessionStorage.setItem('sinais_auth', 'true');
      setSenhaError(false);
    } else {
      setSenhaError(true);
    }
  };

  // Sync: write giros to localStorage when changed locally
  const writeGiros = useCallback((newGiros) => {
    setGiros(newGiros);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGiros));
  }, []);

  // Sync: poll localStorage for changes from RadarTab
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setGiros(prev => {
          if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
          return parsed;
        });
      } catch { /* ignore */ }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const addNumber = (n) => {
    const newGiros = [...giros, n];
    const trimmed = newGiros.length > limiteGiros ? newGiros.slice(-limiteGiros) : newGiros;
    writeGiros(trimmed);
  };

  const undo = () => writeGiros(giros.slice(0, -1));
  const limpar = () => writeGiros([]);

  const setLimite = (valor) => {
    setLimiteGiros(valor);
    if (giros.length > valor) writeGiros(giros.slice(-valor));
  };

  const { red, black } = countColors(giros);

  const keyboard = [];
  for (let i = 1; i <= 36; i++) keyboard.push(i);

  const getRepeatedIndices = () => {
    const reversed = [...giros].reverse();
    const seen = new Set();
    const repeated = new Set();
    for (const n of reversed) { if (seen.has(n)) repeated.add(n); seen.add(n); }
    const markedNums = new Set();
    const blinkSet = new Set();
    reversed.forEach((n, idx) => {
      if (repeated.has(n) && !markedNums.has(n)) { blinkSet.add(idx); markedNums.add(n); }
    });
    return blinkSet;
  };

  // Calculate top 2 reference numbers from the OPPOSITE color
  const getTopRefs = () => {
    if (giros.length === 0) return [];
    const moreBlack = black >= red;
    // Filter numbers by the OPPOSITE (minority) color
    const targetNums = giros.filter(n => {
      if (n === 0) return false;
      const isRed = VERMELHOS.includes(n);
      return moreBlack ? isRed : !isRed; // if more black → count reds' refs
    });

    if (targetNums.length === 0) return [];

    // Count all refs from those numbers
    const refCounts = {};
    for (const n of targetNums) {
      const info = NUMBER_INFO[n];
      if (!info || !info.refs) continue;
      const refs = info.refs.split('/').map(r => parseInt(r)).filter(r => !isNaN(r));
      for (const r of refs) {
        refCounts[r] = (refCounts[r] || 0) + 1;
      }
    }

    // Sort by count descending and take top 2
    const sorted = Object.entries(refCounts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 2).map(([num, count]) => ({ num: parseInt(num), count }));
  };

  // Password screen
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: isHorizontal ? '100%' : '60vh' }} data-testid="sinais-tab">
        <div className="card-glass border-2 border-[#D4AF37] p-8 text-center" style={{ maxWidth: 350 }}>
          <div className="text-[#D4AF37] font-bold text-xl mb-2">EM CONSTRUÇÃO</div>
          <div className="text-gray-400 text-sm mb-6">Área restrita - digite a senha</div>
          <input type="password" value={senhaInput}
            onChange={(e) => { setSenhaInput(e.target.value); setSenhaError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Senha"
            className="w-full p-3 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-center mb-4"
            data-testid="sinais-password-input" />
          {senhaError && <div className="text-red-500 text-sm mb-3">Senha incorreta</div>}
          <button onClick={handleLogin}
            className="w-full py-3 bg-black border-2 border-[#D4AF37] rounded-lg text-[#D4AF37] font-bold hover:bg-[rgba(212,175,55,0.1)]"
            data-testid="sinais-password-submit">
            ENTRAR
          </button>
        </div>
      </div>
    );
  }

  const topRefs = getTopRefs();
  const moreBlack = black >= red;

  // Components
  const CounterHeader = ({ compact }) => (
    <div className={`flex justify-between items-center bg-[rgba(17,17,17,0.8)] rounded-xl border-2 border-[#D4AF37] gap-2 ${compact ? "p-2" : "p-4"}`}>
      <div className="flex-1 text-center">
        <small className="text-gray-400 text-xs">VERM.</small><br />
        <span className={`font-black neon-red ${compact ? "text-2xl" : "text-4xl"}`}>{red}</span>
      </div>
      <div className="flex-[2] text-center">
        <span className={compact ? "text-[#D4AF37] font-bold text-lg" : "text-[#D4AF37] font-bold text-2xl"}>MÉTODO L.O.</span>
      </div>
      <div className="flex-1 text-center">
        <small className="text-gray-400 text-xs">PRETO</small><br />
        <span className={`font-black neon-black ${compact ? "text-2xl" : "text-4xl"}`}>{black}</span>
      </div>
    </div>
  );

  const Keyboard = ({ compact }) => (
    <div className={`grid grid-cols-6 bg-[rgba(17,17,17,0.9)] rounded-xl border-2 border-[#D4AF37] ${compact ? "p-1 flex-1 gap-[2px]" : "p-2 gap-1"}`}
      style={compact ? { gridTemplateRows: "repeat(7, 1fr)" } : {}}>
      <button className={`col-span-6 ${compact ? "bg-[#00ff41] text-black font-black text-base rounded cursor-pointer" : "roulette-btn green"}`}
        onClick={() => addNumber(0)} data-testid="sinais-btn-0">0</button>
      {keyboard.map((n) => (
        <button key={n}
          className={compact ? `${VERMELHOS.includes(n) ? "bg-[#ff3131]" : "bg-[#2b2b2b]"} text-white font-black text-sm rounded cursor-pointer` : `roulette-btn ${VERMELHOS.includes(n) ? "red" : "black"}`}
          onClick={() => addNumber(n)} data-testid={`sinais-btn-${n}`}>{n}</button>
      ))}
    </div>
  );

  const ActionButtons = ({ compact }) => (
    <div className="flex gap-2">
      <button onClick={undo}
        className={`flex-1 bg-black text-white font-bold rounded-lg border-2 border-[#D4AF37] hover:bg-[#1a1a1a] transition-colors ${compact ? "py-2 text-sm" : "py-4"}`}
        data-testid="sinais-btn-undo">CORRIGIR</button>
      <button onClick={limpar}
        className={`flex-1 bg-black text-white font-bold rounded-lg border-2 border-[#D4AF37] hover:bg-[#1a1a1a] transition-colors ${compact ? "py-2 text-sm" : "py-4"}`}
        data-testid="sinais-btn-clear">LIMPAR</button>
    </div>
  );

  const HistoryCard = ({ compact }) => {
    const blinkIndices = getRepeatedIndices();
    return (
      <div className={`card-glass ${compact ? "!p-2" : ""}`}>
        <div className="flex gap-2 mb-2">
          {[12, 14, 50].map(v => (
            <button key={v} className={`ciclo-btn ${limiteGiros === v ? "active" : ""} ${compact ? "!py-1 !text-xs" : ""}`}
              onClick={() => setLimite(v)} data-testid={`sinais-btn-${v}-giros`}>{v} GIROS</button>
          ))}
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="label-accent" style={{ margin: 0, color: '#fff', borderColor: '#D4AF37', fontSize: compact ? '0.7rem' : '0.9rem' }}>HISTÓRICO</span>
          <span className="bg-[#000] text-white px-2 py-0.5 rounded-lg font-bold text-xs border-2 border-[#D4AF37]">
            {giros.length} / {limiteGiros}
          </span>
        </div>
        <div ref={painelRef}
          className={`flex flex-row overflow-x-auto bg-[rgba(17,17,17,0.5)] border border-[#444] rounded-xl p-2 ${compact ? "min-h-[60px]" : "min-h-[100px]"}`}>
          {[...giros].reverse().map((n, idx) => {
            const parity = getParity(n);
            const highLow = getHighLow(n);
            const info = NUMBER_INFO[n] || {};
            const shouldBlink = blinkIndices.has(idx);
            return (
              <div key={idx} className="flex flex-col items-center gap-0.5 shrink-0"
                style={compact ? { width: `calc(100% / ${limiteGiros})`, padding: '0 1px' } : { minWidth: '75px', padding: '0 2px' }}>
                <div className={`mini-ball ${shouldBlink ? 'blink-gold' : ''}`}
                  style={{ background: getBgColor(n), minWidth: compact ? 30 : 40, height: compact ? 30 : 40, fontSize: compact ? '0.8rem' : '1rem' }}>{n}</div>
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

  const RefAnalysisCard = ({ compact }) => {
    if (giros.length === 0) return null;
    const colorLabel = moreBlack ? 'VERMELHOS' : 'PRETOS';
    return (
      <div className={`card-glass border-2 border-[#D4AF37] ${compact ? "!p-2" : ""}`} data-testid="ref-analysis">
        <span className="label-accent" style={{ color: '#fff', borderColor: '#D4AF37', fontSize: compact ? '0.7rem' : '0.9rem' }}>
          ANÁLISE DE REFERÊNCIAS ({colorLabel})
        </span>
        <div className="text-[10px] text-gray-500 mb-2">
          Mesa com mais {moreBlack ? 'preto' : 'vermelho'} → contagem das referências dos {colorLabel.toLowerCase()}
        </div>
        {topRefs.length > 0 ? (
          <div className="flex gap-3 justify-center">
            {topRefs.map((r, i) => (
              <div key={i} className="flex flex-col items-center bg-[rgba(0,0,0,0.5)] border-2 border-[#D4AF37] rounded-xl p-3"
                style={{ minWidth: compact ? 70 : 90 }}>
                <div className="inline-flex items-center justify-center rounded-full text-white font-bold"
                  style={{
                    background: getBgColor(r.num),
                    minWidth: compact ? 36 : 46, height: compact ? 36 : 46,
                    fontSize: compact ? '1rem' : '1.2rem',
                    border: '3px solid #D4AF37',
                    boxShadow: '0 0 12px rgba(212,175,55,0.6)',
                  }}>
                  {r.num}
                </div>
                <span className="text-[#D4AF37] font-bold mt-1" style={{ fontSize: compact ? '0.8rem' : '1rem' }}>
                  {r.count}x
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 text-sm py-2">
            Sem dados suficientes
          </div>
        )}
      </div>
    );
  };

  // Horizontal layout
  if (isHorizontal) {
    return (
      <div className="flex gap-2 h-full min-h-0" data-testid="sinais-tab">
        <div className="flex flex-col gap-1 shrink-0" style={{ width: "280px" }}>
          <CounterHeader compact />
          <Keyboard compact />
          <ActionButtons compact />
        </div>
        <div className="flex flex-col gap-1 min-h-0 overflow-y-auto" style={{ flex: 1, scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 #111' }}>
          <HistoryCard compact />
          <RefAnalysisCard compact />
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="space-y-3" data-testid="sinais-tab">
      <CounterHeader compact={false} />
      <Keyboard compact={false} />
      <ActionButtons compact={false} />
      <HistoryCard compact={false} />
      <RefAnalysisCard compact={false} />
    </div>
  );
};

export default SinaisTab;
