/**
 * Sinais Tab (Em Construção) - Independent tracker synced with RadarTab
 * Password protected. Admin can configure trigger/entry numbers via gear icon.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  VERMELHOS,
  countColors,
  getParity,
  getHighLow,
  getBgColor,
} from "../engine/radarEngine";

const SENHA = "13052017";
const STORAGE_KEY = "radar_giros";
const CONFIG_KEY = "sinais_config";

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

function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { triggerNums: [], entryNums: [], attempts: 2, strategyName: '' };
}

const SinaisTab = ({ viewMode = "vertical" }) => {
  const { isAdmin } = useAuth();
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('sinais_auth') === 'true');
  const [senhaInput, setSenhaInput] = useState("");
  const [senhaError, setSenhaError] = useState(false);
  const [giros, setGiros] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [limiteGiros, setLimiteGiros] = useState(14);
  const painelRef = useRef(null);
  const isHorizontal = viewMode === "horizontal";

  // Config state
  const [config, setConfig] = useState(loadConfig);
  const [showConfig, setShowConfig] = useState(false);
  const [editTrigger, setEditTrigger] = useState('');
  const [editEntry, setEditEntry] = useState('');
  const [editAttempts, setEditAttempts] = useState(2);
  const [editName, setEditName] = useState('');

  const handleLogin = () => {
    if (senhaInput === SENHA) {
      setAuthenticated(true);
      sessionStorage.setItem('sinais_auth', 'true');
      setSenhaError(false);
    } else {
      setSenhaError(true);
    }
  };

  const writeGiros = useCallback((newGiros) => {
    setGiros(newGiros);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGiros));
  }, []);

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

  // --- Signal state ---
  const [signal, _setSignal] = useState(null);
  const signalRef = useRef(null);
  const updateSignal = useCallback((val) => { signalRef.current = val; _setSignal(val); }, []);
  const [scoreboard, setScoreboard] = useState(() => {
    try { const s = sessionStorage.getItem('gatilho_score'); return s ? JSON.parse(s) : { wins: 0, reds: 0 }; } catch { return { wins: 0, reds: 0 }; }
  });
  const prevGirosKeyRef = useRef(giros.join(','));

  useEffect(() => {
    sessionStorage.setItem('gatilho_score', JSON.stringify(scoreboard));
  }, [scoreboard]);

  // Signal processing: trigger when new giro is in triggerNums
  useEffect(() => {
    const currKey = giros.join(',');
    const prevKey = prevGirosKeyRef.current;
    prevGirosKeyRef.current = currKey;
    if (currKey === prevKey) return;

    if (giros.length === 0) { updateSignal(null); return; }

    const prevArr = prevKey ? prevKey.split(',').filter(Boolean).map(Number) : [];
    const lastNum = giros[giros.length - 1];
    const prevLast = prevArr.length > 0 ? prevArr[prevArr.length - 1] : undefined;
    const isNew = giros.length > prevArr.length ||
      (giros.length === prevArr.length && lastNum !== prevLast);

    if (!isNew) {
      if (giros.length < prevArr.length) updateSignal(null);
      return;
    }

    const { triggerNums, entryNums, attempts } = config;
    if (triggerNums.length === 0 || entryNums.length === 0) return;

    const sig = signalRef.current;
    if (sig) {
      // Active signal: check hit/miss
      if (entryNums.includes(lastNum)) {
        setScoreboard(p => ({ wins: p.wins + 1, reds: p.reds }));
        updateSignal(null);
        // Check if this giro is also a trigger for a new signal
        if (triggerNums.includes(lastNum)) {
          updateSignal({ numbers: entryNums, attemptsUsed: 0, triggerNum: lastNum });
        }
      } else {
        const next = sig.attemptsUsed + 1;
        if (next >= attempts) {
          setScoreboard(p => ({ wins: p.wins, reds: p.reds + 1 }));
          updateSignal(null);
          if (triggerNums.includes(lastNum)) {
            updateSignal({ numbers: entryNums, attemptsUsed: 0, triggerNum: lastNum });
          }
        } else {
          updateSignal({ ...sig, attemptsUsed: next });
        }
      }
    } else {
      // No signal: check if new number is a trigger
      if (triggerNums.includes(lastNum)) {
        updateSignal({ numbers: entryNums, attemptsUsed: 0, triggerNum: lastNum });
      }
    }
  }, [giros, updateSignal, config]);

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

  const getTopRefs = () => {
    if (giros.length === 0) return [];
    const moreBlack = black >= red;
    const refCounts = {};
    for (const n of giros) {
      const info = NUMBER_INFO[n];
      if (!info || !info.refs) continue;
      const refs = info.refs.split('/').map(r => parseInt(r)).filter(r => !isNaN(r));
      for (const r of refs) {
        if (r === 0) continue;
        const refIsRed = VERMELHOS.includes(r);
        const isMinority = moreBlack ? refIsRed : !refIsRed;
        if (isMinority) {
          refCounts[r] = (refCounts[r] || 0) + 1;
        }
      }
    }
    const sorted = Object.entries(refCounts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 2).map(([num, count]) => ({ num: parseInt(num), count }));
  };

  // --- Config panel helpers ---
  const openConfig = () => {
    setEditTrigger(config.triggerNums.join(', '));
    setEditEntry(config.entryNums.join(', '));
    setEditAttempts(config.attempts || 2);
    setEditName(config.strategyName || '');
    setShowConfig(true);
  };

  const saveConfig = () => {
    const parseLine = (txt) => txt.split(/[,\s]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n <= 36);
    const newCfg = {
      triggerNums: parseLine(editTrigger),
      entryNums: parseLine(editEntry),
      attempts: editAttempts,
      strategyName: editName.trim(),
    };
    setConfig(newCfg);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newCfg));
    setShowConfig(false);
    // Reset signal and scoreboard on config change
    updateSignal(null);
    setScoreboard({ wins: 0, reds: 0 });
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

  // --- Sub-components ---
  const CounterHeader = ({ compact }) => (
    <div className={`flex justify-between items-center bg-[rgba(17,17,17,0.8)] rounded-xl border-2 border-[#D4AF37] gap-2 ${compact ? "p-2" : "p-4"}`}>
      <div className="flex-1 text-center">
        <small className="text-gray-400 text-xs">VERM.</small><br />
        <span className={`font-black neon-red ${compact ? "text-2xl" : "text-4xl"}`}>{red}</span>
      </div>
      <div className="flex-[2] text-center">
        <span className={compact ? "logo-metodo text-xl" : "logo-metodo"} style={compact ? { fontSize: "1.2rem" } : {}}>Método L.O</span>
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
          ANÁLISE IGUALITÁRIOS
        </span>
        <div className="text-[10px] text-gray-500 mb-2">
          Mesa com mais {moreBlack ? 'preto' : 'vermelho'} → contagem dos {colorLabel.toLowerCase()} nas referências
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
          <div className="text-center text-gray-600 text-sm py-2">Sem dados suficientes</div>
        )}
      </div>
    );
  };

  const GatilhoCard = ({ compact }) => {
    const remaining = signal ? config.attempts - signal.attemptsUsed : 0;
    const hasConfig = config.triggerNums.length > 0 && config.entryNums.length > 0;

    return (
      <div className={`card-glass border-2 border-[#D4AF37] ${compact ? "!p-2" : ""}`} data-testid="gatilho-card">
        <div className="flex justify-between items-center">
          <span className="label-accent" style={{ margin: 0, color: '#fff', borderColor: '#D4AF37', fontSize: compact ? '0.7rem' : '0.9rem' }}>
            GATILHOS DE ENTRADA{config.strategyName ? ` — ${config.strategyName}` : ''}
          </span>
          {isAdmin && (
            <button onClick={openConfig} className="text-[#D4AF37] hover:text-white transition-colors p-1" data-testid="gatilho-config-btn">
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

        {!hasConfig ? (
          <div className="text-center text-gray-600 text-sm py-4 mt-2" data-testid="gatilho-no-config">
            {isAdmin ? 'Configure a estratégia no ícone de engrenagem' : 'Estratégia não configurada'}
          </div>
        ) : signal ? (
          <div className="gatilho-signal-box bg-[rgba(0,0,0,0.6)] border-2 border-[#D4AF37] rounded-xl p-3 mt-2"
            data-testid="gatilho-signal-active">
            <div className="text-center text-[#D4AF37] font-bold mb-2" style={{ fontSize: compact ? '0.75rem' : '0.9rem' }}>
              ENTRADA CONFIRMADA
            </div>
            <div className="flex gap-2 flex-wrap justify-center mb-2">
              {signal.numbers.map(n => (
                <div key={n} className="inline-flex items-center justify-center rounded-full text-white font-bold"
                  style={{
                    background: getBgColor(n),
                    width: compact ? 34 : 42, height: compact ? 34 : 42,
                    fontSize: compact ? '0.85rem' : '1rem',
                    border: '3px solid #D4AF37',
                    boxShadow: '0 0 10px rgba(212,175,55,0.5)',
                  }}>
                  {n}
                </div>
              ))}
            </div>
            <div className="text-center text-gray-400" style={{ fontSize: compact ? '0.6rem' : '0.75rem' }}>
              {remaining} tentativa{remaining !== 1 ? 's' : ''} restante{remaining !== 1 ? 's' : ''}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600 text-sm py-2 mt-2" data-testid="gatilho-signal-idle">
            Aguardando gatilho...
          </div>
        )}

        <div className="flex gap-4 justify-center mt-2" data-testid="gatilho-scoreboard">
          <div className="flex items-center gap-1">
            <span className="font-bold" style={{ color: '#00ff41', fontSize: compact ? '0.7rem' : '0.85rem' }}>GREEN:</span>
            <span className="text-white font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,65,0.15)', border: '1px solid rgba(0,255,65,0.4)', fontSize: compact ? '0.7rem' : '0.85rem' }}>
              {scoreboard.wins}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold" style={{ color: '#ff3131', fontSize: compact ? '0.7rem' : '0.85rem' }}>RED:</span>
            <span className="text-white font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(255,49,49,0.15)', border: '1px solid rgba(255,49,49,0.4)', fontSize: compact ? '0.7rem' : '0.85rem' }}>
              {scoreboard.reds}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Config modal
  const ConfigModal = () => {
    if (!showConfig) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" data-testid="gatilho-config-modal">
        <div className="card-glass border-2 border-[#D4AF37] p-5 w-full max-w-md mx-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="text-[#D4AF37] font-bold text-lg mb-4 text-center">CONFIGURAR ESTRATÉGIA</div>

          <div className="mb-4">
            <label className="text-gray-300 text-xs font-bold block mb-1">NOME DA ESTRATÉGIA</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
              placeholder="Ex: 8/3"
              className="w-full p-2 bg-black border-2 border-[#555] rounded-lg text-white text-sm focus:border-[#D4AF37] outline-none"
              data-testid="config-name-input" />
          </div>

          <div className="mb-4">
            <label className="text-gray-300 text-xs font-bold block mb-1">NÚMEROS GATILHO <span className="text-gray-500">(separe por vírgula)</span></label>
            <input type="text" value={editTrigger} onChange={e => setEditTrigger(e.target.value)}
              placeholder="Ex: 2, 8, 11, 17, 20, 26, 28, 29, 35"
              className="w-full p-2 bg-black border-2 border-[#555] rounded-lg text-white text-sm focus:border-[#D4AF37] outline-none"
              data-testid="config-trigger-input" />
            <div className="text-[10px] text-gray-500 mt-1">Quando qualquer um desses números sair, dispara a entrada</div>
          </div>

          <div className="mb-4">
            <label className="text-gray-300 text-xs font-bold block mb-1">NÚMEROS DE ENTRADA <span className="text-gray-500">(separe por vírgula)</span></label>
            <input type="text" value={editEntry} onChange={e => setEditEntry(e.target.value)}
              placeholder="Ex: 2, 8, 11, 17, 20, 26, 28, 29, 35"
              className="w-full p-2 bg-black border-2 border-[#555] rounded-lg text-white text-sm focus:border-[#D4AF37] outline-none"
              data-testid="config-entry-input" />
            <div className="text-[10px] text-gray-500 mt-1">Números para apostar quando o gatilho disparar</div>
          </div>

          <div className="mb-5">
            <label className="text-gray-300 text-xs font-bold block mb-1">TENTATIVAS</label>
            <div className="flex gap-2">
              {[2, 3].map(v => (
                <button key={v} onClick={() => setEditAttempts(v)}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-colors ${editAttempts === v ? 'bg-[rgba(212,175,55,0.2)] border-[#D4AF37] text-[#D4AF37]' : 'bg-black border-[#555] text-gray-400'}`}
                  data-testid={`config-attempts-${v}`}>
                  {v} Tentativas
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={saveConfig}
              className="flex-1 py-3 bg-[rgba(212,175,55,0.2)] border-2 border-[#D4AF37] rounded-lg text-[#D4AF37] font-bold hover:bg-[rgba(212,175,55,0.3)] transition-colors"
              data-testid="config-save-btn">
              SALVAR
            </button>
            <button onClick={() => setShowConfig(false)}
              className="flex-1 py-3 bg-black border-2 border-[#555] rounded-lg text-gray-400 font-bold hover:border-gray-400 transition-colors"
              data-testid="config-cancel-btn">
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Horizontal layout
  if (isHorizontal) {
    return (
      <div className="flex gap-2 h-full min-h-0" data-testid="sinais-tab">
        <ConfigModal />
        <div className="flex flex-col gap-1 shrink-0" style={{ width: "280px" }}>
          <CounterHeader compact />
          <Keyboard compact />
          <ActionButtons compact />
        </div>
        <div className="flex flex-col gap-1 min-h-0 overflow-y-auto" style={{ flex: 1, scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 #111' }}>
          <HistoryCard compact />
          <RefAnalysisCard compact />
          <GatilhoCard compact />
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="space-y-3" data-testid="sinais-tab">
      <ConfigModal />
      <CounterHeader compact={false} />
      <Keyboard compact={false} />
      <ActionButtons compact={false} />
      <HistoryCard compact={false} />
      <RefAnalysisCard compact={false} />
      <GatilhoCard compact={false} />
    </div>
  );
};

export default SinaisTab;
