/**
 * Sinais Tab - Signal monitoring (password protected)
 * Monitors: Região (6+ confirmations), FB Strategy, Ocultos (weight ≥ 20)
 */
import React, { useState, useEffect, useRef } from "react";
import {
  REGIOES_MAPEADAS,
  calculateTerminalWeights,
  calculateRegionFrequencies,
  getTerminalFamily,
  getBgColor,
} from "../engine/radarEngine";

const STORAGE_KEY = "radar_giros";
const SENHA = "13052017";

// FB detection logic (same as RadarTab)
const FB_OCULTOS = {
  0: [0, 10, 20, 30, 28],
  1: [1, 12, 21, 23, 32, 34],
  2: [2, 11, 20, 29],
  3: [3, 12, 21, 30],
  4: [4, 13, 22, 31],
  5: [5, 14, 23, 32],
  6: [6, 15, 24, 33],
  7: [7, 16, 25, 34],
  8: [8, 17, 26, 35],
  9: [9, 18, 27, 36],
  10: [10, 19, 28],
};

const digitalRoot = (n) => {
  if (n === 0) return 0;
  return n % 9 === 0 ? 9 : n % 9;
};

const detectionRoot = (n) => {
  if (n === 10 || n === 19 || n === 28) return 10;
  return digitalRoot(n);
};

const getFBEntry = (n) => {
  if (n === 0) return FB_OCULTOS[0];
  if (n === 1) return FB_OCULTOS[1];
  if (n === 10 || n === 19 || n === 28) return FB_OCULTOS[10];
  return FB_OCULTOS[digitalRoot(n)] || [];
};

const detectFBPattern = (a, b, c) => {
  const da = detectionRoot(a), db = detectionRoot(b), dc = detectionRoot(c);
  if (db === dc && da !== dc) return { remaining: a, entry: getFBEntry(a) };
  if (da === dc && db !== dc) return { remaining: b, entry: getFBEntry(b) };
  return null;
};

const SinaisTab = ({ viewMode = "vertical" }) => {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('sinais_auth') === 'true');
  const [senhaInput, setSenhaInput] = useState("");
  const [senhaError, setSenhaError] = useState(false);
  const [signals, setSignals] = useState([]);
  const [signalCounter, setSignalCounter] = useState(0);
  const prevGirosRef = useRef([]);
  const activeSignalsRef = useRef([]);
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

  // Monitor giros from localStorage
  useEffect(() => {
    if (!authenticated) return;

    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const giros = saved ? JSON.parse(saved) : [];
        const prev = prevGirosRef.current;

        if (JSON.stringify(giros) === JSON.stringify(prev)) return;

        if (giros.length === 0) {
          activeSignalsRef.current = [];
          prevGirosRef.current = giros;
          return;
        }

        // Find how many new numbers were added since last check
        let newNumbers = [];
        if (giros.length > prev.length) {
          // Numbers added
          newNumbers = giros.slice(prev.length);
        } else if (giros.length === prev.length && giros[giros.length - 1] !== prev[prev.length - 1]) {
          // At limit - last number changed
          newNumbers = [giros[giros.length - 1]];
        } else if (giros.length < prev.length) {
          // Undo happened - don't process
          prevGirosRef.current = giros;
          return;
        }

        if (newNumbers.length === 0) {
          prevGirosRef.current = giros;
          return;
        }

        // Process each new number sequentially
        let updatedActive = [...activeSignalsRef.current];
        let allNewSignals = [];

        for (let ni = 0; ni < newNumbers.length; ni++) {
          const newNum = newNumbers[ni];
          // The giros state at this point
          const girosAtPoint = giros.slice(0, prev.length + ni + 1);
          if (girosAtPoint.length > giros.length) break;

          // --- Update active signals ---
          updatedActive = updatedActive.map(s => {
            if (s.status !== 'waiting') return s;
            if (s.skipFirst) {
              return { ...s, skipFirst: false };
            }
            const hit = s.numbers.includes(newNum);
            const attemptsUsed = s.attemptsUsed + 1;
            if (hit) {
              return { ...s, status: 'green', attemptsUsed, hitNumber: newNum };
            } else if (attemptsUsed >= 3) {
              return { ...s, status: 'red', attemptsUsed };
            }
            return { ...s, attemptsUsed };
          });

          // --- Detect REGIÃO signal ---
          if (girosAtPoint.length >= 6) {
            const freqs = calculateRegionFrequencies(girosAtPoint);
            for (const [regionName, count] of Object.entries(freqs)) {
              if (count >= 6) {
                const regionNums = REGIOES_MAPEADAS[regionName];
                if (regionNums.includes(newNum)) {
                  const alreadyActive = updatedActive.some(
                    s => s.type === 'região' && s.label === regionName && s.status === 'waiting'
                  );
                  if (!alreadyActive) {
                    const sig = {
                      id: Date.now() + Math.random(),
                      type: 'região',
                      label: regionName,
                      detail: `${count} confirmações`,
                      numbers: regionNums,
                      status: 'waiting',
                      attemptsUsed: 0,
                      hitNumber: null,
                      skipFirst: true,
                    };
                    updatedActive.push(sig);
                    allNewSignals.push(sig);
                  }
                }
              }
            }
          }

          // --- Detect FB signal ---
          if (girosAtPoint.length >= 3) {
            const [a, b, c] = girosAtPoint.slice(-3);
            const pattern = detectFBPattern(a, b, c);
            if (pattern) {
              const sig = {
                id: Date.now() + Math.random() + ni,
                type: 'fb',
                label: `${c}, ${b}, ${a}`,
                detail: 'Padrão formado',
                numbers: pattern.entry,
                status: 'waiting',
                attemptsUsed: 0,
                hitNumber: null,
                skipFirst: true,
              };
              updatedActive.push(sig);
              allNewSignals.push(sig);
            }
          }

          // --- Detect OCULTOS signal ---
          if (girosAtPoint.length >= 3) {
            const weights = calculateTerminalWeights(girosAtPoint);
            if (weights.length > 0 && weights[0].peso >= 20) {
              const topTerminal = weights[0].terminal;
              const family = getTerminalFamily(topTerminal);
              const alreadyActive = updatedActive.some(
                s => s.type === 'ocultos' && s.label === `Terminal ${topTerminal}` && s.status === 'waiting'
              );
              if (!alreadyActive) {
                const sig = {
                  id: Date.now() + Math.random() + ni + 0.5,
                  type: 'ocultos',
                  label: `Terminal ${topTerminal}`,
                  detail: `Peso ${weights[0].peso}x`,
                  numbers: family,
                  status: 'waiting',
                  attemptsUsed: 0,
                  hitNumber: null,
                  skipFirst: true,
                };
                updatedActive.push(sig);
                allNewSignals.push(sig);
              }
            }
          }
        }

        // Update refs and state
        activeSignalsRef.current = updatedActive.filter(s => s.status === 'waiting');

        setSignals(prev => {
          let updated = [...prev];
          // Update existing signals that changed status
          for (const s of updatedActive) {
            const idx = updated.findIndex(u => u.id === s.id);
            if (idx >= 0) {
              updated[idx] = s;
            }
          }
          // Add new signals
          for (const n of allNewSignals) {
            if (!updated.some(u => u.id === n.id)) {
              updated.push(n);
            }
          }
          return updated;
        });

        prevGirosRef.current = giros;
      } catch (e) {
        console.error("Sinais monitor error:", e);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [authenticated]);

  // Count stats
  const greens = signals.filter(s => s.status === 'green').length;
  const reds = signals.filter(s => s.status === 'red').length;
  const waiting = signals.filter(s => s.status === 'waiting').length;
  const total = greens + reds;
  const taxa = total > 0 ? ((greens / total) * 100).toFixed(0) : '-';

  // Password screen
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: isHorizontal ? '100%' : '60vh' }} data-testid="sinais-tab">
        <div className="card-glass border-2 border-[#D4AF37] p-8 text-center" style={{ maxWidth: 350 }}>
          <div className="text-[#D4AF37] font-bold text-xl mb-2">EM CONSTRUÇÃO</div>
          <div className="text-gray-400 text-sm mb-6">Área restrita - digite a senha</div>
          <input
            type="password"
            value={senhaInput}
            onChange={(e) => { setSenhaInput(e.target.value); setSenhaError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Senha"
            className="w-full p-3 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-center mb-4"
            data-testid="sinais-password-input"
          />
          {senhaError && <div className="text-red-500 text-sm mb-3">Senha incorreta</div>}
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-black border-2 border-[#D4AF37] rounded-lg text-[#D4AF37] font-bold hover:bg-[rgba(212,175,55,0.1)] transition-colors"
            data-testid="sinais-password-submit"
          >
            ENTRAR
          </button>
        </div>
      </div>
    );
  }

  const SignalCard = ({ signal }) => {
    const statusColor = signal.status === 'green' ? '#00ff41' : signal.status === 'red' ? '#ff3131' : '#D4AF37';
    const statusText = signal.status === 'green' ? 'GREEN' : signal.status === 'red' ? 'RED' : `Tentativa ${signal.attemptsUsed}/3`;
    const statusIcon = signal.status === 'green' ? '✅' : signal.status === 'red' ? '❌' : '⏳';
    const typeLabel = signal.type === 'região' ? 'REGIÃO' : signal.type === 'fb' ? 'ESTRATÉGIA FB' : 'OCULTOS';

    return (
      <div className="bg-[rgba(17,17,17,0.9)] rounded-xl border-2 p-3 mb-2" style={{ borderColor: statusColor }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-bold" style={{ color: statusColor }}>{typeLabel}</span>
            <span className="text-gray-400 text-xs ml-2">{signal.label}</span>
            <span className="text-gray-500 text-xs ml-2">({signal.detail})</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs">{statusIcon}</span>
            <span className="text-xs font-bold" style={{ color: statusColor }}>{statusText}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-white text-xs font-bold mr-1">Entrada:</span>
          <div className="flex flex-wrap gap-1">
            {signal.numbers.map((n, i) => (
              <div
                key={i}
                className="mini-ball"
                style={{
                  background: getBgColor(n),
                  minWidth: 30,
                  height: 30,
                  fontSize: '0.75rem',
                  border: n === signal.hitNumber ? '3px solid #00ff41' : '2px solid #D4AF37',
                  boxShadow: n === signal.hitNumber ? '0 0 10px rgba(0,255,65,0.6)' : '0 0 6px rgba(212,175,55,0.4)',
                }}
              >
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Main content
  return (
    <div className={isHorizontal ? "h-full overflow-y-auto" : "space-y-3"} style={isHorizontal ? { scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 #111' } : {}} data-testid="sinais-tab">
      {/* Header */}
      <div className="text-center mb-3">
        <span className="text-[#D4AF37] font-bold text-lg">EM CONSTRUÇÃO</span>
        <div className="text-gray-500 text-xs">Monitoramento de Sinais</div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-black border-2 border-[#D4AF37] rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-400">GREENS</div>
          <div className="text-lg font-bold" style={{ color: '#00ff41' }}>{greens}</div>
        </div>
        <div className="bg-black border-2 border-[#D4AF37] rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-400">REDS</div>
          <div className="text-lg font-bold" style={{ color: '#ff3131' }}>{reds}</div>
        </div>
        <div className="bg-black border-2 border-[#D4AF37] rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-400">AGUARDANDO</div>
          <div className="text-lg font-bold text-[#D4AF37]">{waiting}</div>
        </div>
        <div className="bg-black border-2 border-[#D4AF37] rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-400">TAXA</div>
          <div className="text-lg font-bold text-white">{taxa}%</div>
        </div>
      </div>

      {/* Green/Red bar */}
      {total > 0 && (
        <div className="flex rounded-full overflow-hidden h-3 mb-3 border border-[#333]">
          <div style={{ width: `${(greens / total) * 100}%`, background: '#00ff41' }} />
          <div style={{ width: `${(reds / total) * 100}%`, background: '#ff3131' }} />
        </div>
      )}

      {/* Signal cards */}
      <div>
        {signals.length > 0 ? (
          [...signals].reverse().map(s => <SignalCard key={s.id} signal={s} />)
        ) : (
          <div className="card-glass text-center py-8">
            <div className="text-gray-600 text-sm">Adicione números no Radar de Jogo</div>
            <div className="text-gray-700 text-xs mt-1">Os sinais aparecerão aqui automaticamente</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinaisTab;
