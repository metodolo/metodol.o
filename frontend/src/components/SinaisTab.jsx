/**
 * Sinais Tab - Signal monitoring using strategies from admin panel
 * Password protected - evaluates strategies against giros in real time
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  REGIOES_MAPEADAS,
  VERMELHOS,
  calculateRegionFrequencies,
  calculateTerminalWeights,
  getTerminalFamily,
  getBgColor,
} from "../engine/radarEngine";
import { strategiesApi } from "../services/api";

const STORAGE_KEY = "radar_giros";
const SENHA = "13052017";

// FB detection logic
const FB_OCULTOS = {
  0: [0, 10, 20, 30, 28], 1: [1, 12, 21, 23, 32, 34], 2: [2, 11, 20, 29],
  3: [3, 12, 21, 30], 4: [4, 13, 22, 31], 5: [5, 14, 23, 32],
  6: [6, 15, 24, 33], 7: [7, 16, 25, 34], 8: [8, 17, 26, 35],
  9: [9, 18, 27, 36], 10: [10, 19, 28],
};
const digitalRoot = (n) => { if (n === 0) return 0; return n % 9 === 0 ? 9 : n % 9; };
const detectionRoot = (n) => { if (n === 10 || n === 19 || n === 28) return 10; return digitalRoot(n); };
const getFBEntry = (n) => {
  if (n === 0) return FB_OCULTOS[0]; if (n === 1) return FB_OCULTOS[1];
  if (n === 10 || n === 19 || n === 28) return FB_OCULTOS[10];
  return FB_OCULTOS[digitalRoot(n)] || [];
};
const detectFBPattern = (a, b, c) => {
  const da = detectionRoot(a), db = detectionRoot(b), dc = detectionRoot(c);
  if (db === dc && da !== dc) return { remaining: a, entry: getFBEntry(a) };
  if (da === dc && db !== dc) return { remaining: b, entry: getFBEntry(b) };
  return null;
};

// Evaluate a single condition block
const evaluateCondition = (cond, giros, newNum) => {
  switch (cond.type) {
    case 'region_count': {
      if (!cond.region) return false;
      const freqs = calculateRegionFrequencies(giros);
      return (freqs[cond.region] || 0) >= (cond.min_count || 6);
    }
    case 'region_ponta': {
      if (!cond.region) return false;
      const regionNums = REGIOES_MAPEADAS[cond.region] || [];
      return regionNums.includes(newNum);
    }
    case 'number_repeated': {
      const target = parseInt(cond.number);
      if (isNaN(target)) return false;
      return giros.filter(n => n === target).length >= (cond.min_repeats || 2);
    }
    case 'specific_number_ponta': {
      const target = parseInt(cond.number);
      if (isNaN(target)) return false;
      return newNum === target;
    }
    case 'fb_pattern': {
      if (giros.length < 3) return false;
      const [a, b, c] = giros.slice(-3);
      return detectFBPattern(a, b, c) !== null;
    }
    case 'ocultos_strong': {
      const weights = calculateTerminalWeights(giros);
      if (weights.length === 0) return false;
      return weights[0].peso >= (cond.min_ocultos || 20);
    }
    case 'color_count': {
      const color = cond.color || 'preto';
      let count = 0;
      for (const n of giros) {
        if (n === 0) continue;
        const isRed = VERMELHOS.includes(n);
        if (color === 'vermelho' && isRed) count++;
        if (color === 'preto' && !isRed) count++;
      }
      return count >= (cond.min_color || 8);
    }
    case 'color_sequence': {
      const color = cond.color || 'preto';
      const minSeq = cond.min_sequence || 4;
      let streak = 0;
      for (let i = giros.length - 1; i >= 0; i--) {
        const n = giros[i];
        if (n === 0) break;
        const isRed = VERMELHOS.includes(n);
        if ((color === 'vermelho' && isRed) || (color === 'preto' && !isRed)) {
          streak++;
        } else break;
      }
      return streak >= minSeq;
    }
    case 'highlow_count': {
      const hl = cond.highlow || 'alto';
      let count = 0;
      for (const n of giros) {
        if (n === 0) continue;
        if (hl === 'alto' && n >= 25) count++;
        if (hl === 'medio' && n >= 13 && n <= 24) count++;
        if (hl === 'baixo' && n >= 1 && n <= 12) count++;
      }
      return count >= (cond.min_highlow || 5);
    }
    default:
      return false;
  }
};

// Evaluate all conditions of a strategy (ALL must be true)
const evaluateTrigger = (strategy, giros, newNum) => {
  if (strategy.condition_type === 'multi') {
    const conditions = strategy.condition_params?.conditions || [];
    if (conditions.length === 0) return false;
    return conditions.every(c => evaluateCondition(c, giros, newNum));
  }
  // Legacy single condition support
  const { condition_type, condition_params: p } = strategy;

  if (condition_type === 'region_strong') {
    if (giros.length < (p.min_confirmations || 6)) return false;
    const freqs = calculateRegionFrequencies(giros);
    const targetRegion = p.region || '';
    if (targetRegion) {
      const count = freqs[targetRegion] || 0;
      if (count < (p.min_confirmations || 6)) return false;
      if (p.needs_ponta) return (REGIOES_MAPEADAS[targetRegion] || []).includes(newNum);
      return true;
    }
    return false;
  }
  if (condition_type === 'number_repeated') {
    const target = p.number;
    if (target === undefined) return false;
    return giros.filter(n => n === parseInt(target)).length >= (p.min_repeats || 2);
  }
  if (condition_type === 'fb_pattern') {
    if (giros.length < 3) return false;
    const [a, b, c] = giros.slice(-3);
    return detectFBPattern(a, b, c) !== null;
  }
  if (condition_type === 'specific_number') {
    const target = p.number;
    if (target === undefined) return false;
    if (p.needs_ponta) return newNum === parseInt(target);
    return giros.includes(parseInt(target));
  }
  return false;
};

const SinaisTab = ({ viewMode = "vertical" }) => {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('sinais_auth') === 'true');
  const [senhaInput, setSenhaInput] = useState("");
  const [senhaError, setSenhaError] = useState(false);
  const [strategies, setStrategies] = useState([]);
  const [signals, setSignals] = useState([]);
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

  // Fetch strategies from backend
  const fetchStrategies = useCallback(async () => {
    try {
      const res = await strategiesApi.list();
      setStrategies((res.strategies || []).filter(s => s.is_active));
    } catch (e) {
      console.error('Failed to fetch strategies:', e);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchStrategies();
    const interval = setInterval(fetchStrategies, 30000);
    return () => clearInterval(interval);
  }, [authenticated, fetchStrategies]);

  // Monitor giros
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

        // Find new numbers
        let newNumbers = [];
        if (giros.length > prev.length) {
          newNumbers = giros.slice(prev.length);
        } else if (giros.length === prev.length && giros[giros.length - 1] !== prev[prev.length - 1]) {
          newNumbers = [giros[giros.length - 1]];
        } else if (giros.length < prev.length) {
          prevGirosRef.current = giros;
          return;
        }

        if (newNumbers.length === 0) { prevGirosRef.current = giros; return; }

        let updatedActive = [...activeSignalsRef.current];
        let allNewSignals = [];

        for (let ni = 0; ni < newNumbers.length; ni++) {
          const newNum = newNumbers[ni];
          const girosAtPoint = giros.slice(0, prev.length + ni + 1);

          // Update existing signals
          updatedActive = updatedActive.map(s => {
            if (s.status !== 'waiting') return s;
            if (s.skipFirst) return { ...s, skipFirst: false };
            const hit = s.numbers.includes(newNum);
            const attemptsUsed = s.attemptsUsed + 1;
            if (hit) return { ...s, status: 'green', attemptsUsed, hitNumber: newNum };
            if (attemptsUsed >= s.maxAttempts) return { ...s, status: 'red', attemptsUsed };
            return { ...s, attemptsUsed };
          });

          // Evaluate strategies
          for (const strategy of strategies) {
            const triggered = evaluateTrigger(strategy, girosAtPoint, newNum);
            if (!triggered) continue;

            // Don't create duplicate active signal for same strategy
            const alreadyActive = updatedActive.some(
              s => s.strategyId === strategy.id && s.status === 'waiting'
            );
            if (alreadyActive) continue;

            let entryNums = strategy.action_params?.numbers || [];
            // For FB pattern, use the actual FB entry
            if (strategy.condition_type === 'fb_pattern' && girosAtPoint.length >= 3) {
              const [a, b, c] = girosAtPoint.slice(-3);
              const pat = detectFBPattern(a, b, c);
              if (pat) entryNums = pat.entry;
            }

            const sig = {
              id: Date.now() + Math.random() + ni,
              strategyId: strategy.id,
              strategyName: strategy.name,
              type: strategy.condition_type,
              numbers: entryNums,
              maxAttempts: strategy.attempts || 3,
              status: 'waiting',
              attemptsUsed: 0,
              hitNumber: null,
              skipFirst: true,
            };
            updatedActive.push(sig);
            allNewSignals.push(sig);
          }
        }

        activeSignalsRef.current = updatedActive.filter(s => s.status === 'waiting');

        setSignals(prev => {
          let updated = [...prev];
          for (const s of updatedActive) {
            const idx = updated.findIndex(u => u.id === s.id);
            if (idx >= 0) { updated[idx] = s; }
          }
          for (const n of allNewSignals) {
            if (!updated.some(u => u.id === n.id)) updated.push(n);
          }
          return updated;
        });

        prevGirosRef.current = giros;
      } catch (e) {
        console.error("Sinais error:", e);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [authenticated, strategies]);

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

  const SignalCard = ({ signal }) => {
    const statusColor = signal.status === 'green' ? '#00ff41' : signal.status === 'red' ? '#ff3131' : '#D4AF37';
    const statusText = signal.status === 'green' ? 'GREEN' : signal.status === 'red' ? 'RED' : `Tentativa ${signal.attemptsUsed}/${signal.maxAttempts}`;
    const statusIcon = signal.status === 'green' ? '✅' : signal.status === 'red' ? '❌' : '⏳';

    return (
      <div className="bg-[rgba(17,17,17,0.9)] rounded-xl border-2 p-3 mb-2" style={{ borderColor: statusColor }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-bold text-sm">{signal.strategyName}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs">{statusIcon}</span>
            <span className="text-xs font-bold" style={{ color: statusColor }}>{statusText}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-white text-xs font-bold mr-1">Entrada:</span>
          {signal.numbers.map((n, i) => (
            <div key={i} className="inline-flex items-center justify-center rounded-full text-white font-bold"
              style={{
                background: getBgColor(n), minWidth: 30, height: 30, fontSize: '0.75rem',
                border: n === signal.hitNumber ? '3px solid #00ff41' : '2px solid #D4AF37',
                boxShadow: n === signal.hitNumber ? '0 0 10px rgba(0,255,65,0.6)' : '0 0 6px rgba(212,175,55,0.4)',
              }}>
              {n}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={isHorizontal ? "h-full overflow-y-auto" : "space-y-3"} style={isHorizontal ? { scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 #111' } : {}} data-testid="sinais-tab">
      <div className="text-center mb-3">
        <span className="text-[#D4AF37] font-bold text-lg">EM CONSTRUÇÃO</span>
        <div className="text-gray-500 text-xs">Monitoramento de Sinais</div>
      </div>

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

      {total > 0 && (
        <div className="flex rounded-full overflow-hidden h-3 mb-3 border border-[#333]">
          <div style={{ width: `${(greens / total) * 100}%`, background: '#00ff41' }} />
          <div style={{ width: `${(reds / total) * 100}%`, background: '#ff3131' }} />
        </div>
      )}

      <div>
        {signals.length > 0 ? (
          [...signals].reverse().map(s => <SignalCard key={s.id} signal={s} />)
        ) : (
          <div className="card-glass border-2 border-[#333] text-center py-8">
            <div className="text-gray-500 text-sm">
              {strategies.length === 0 ? 'Nenhuma estratégia configurada' : 'Adicione números no Radar de Jogo'}
            </div>
            <div className="text-gray-600 text-xs mt-1">
              {strategies.length === 0 ? 'Configure estratégias no painel (engrenagem)' : 'Os sinais aparecerão aqui automaticamente'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinaisTab;
