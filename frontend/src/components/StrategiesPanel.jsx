/**
 * Strategies Panel - Admin only - Free-form strategy builder
 */
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Plus, Trash2, ToggleLeft, ToggleRight, Save, Edit2, X } from "lucide-react";
import { strategiesApi } from "../services/api";
import { getBgColor } from "../engine/radarEngine";

const TRIGGER_TYPES = [
  { value: 'region_strong', label: 'Região forte' },
  { value: 'number_repeated', label: 'Número repetiu' },
  { value: 'fb_pattern', label: 'Estratégia FB formou' },
  { value: 'specific_number', label: 'Número específico saiu' },
];

const REGIONS = ['6/5', '1/4', '8/3', '7/2', '9/0'];

const StrategiesPanel = ({ onBack }) => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('region_strong');
  const [triggerRegion, setTriggerRegion] = useState('');
  const [triggerMinConf, setTriggerMinConf] = useState(6);
  const [triggerNeedsPonta, setTriggerNeedsPonta] = useState(true);
  const [triggerNumber, setTriggerNumber] = useState('');
  const [triggerMinRepeats, setTriggerMinRepeats] = useState(2);
  const [entryNumbers, setEntryNumbers] = useState('');
  const [attempts, setAttempts] = useState(3);

  const fetchStrategies = useCallback(async () => {
    try {
      const res = await strategiesApi.list();
      setStrategies(res.strategies || []);
    } catch (e) {
      console.error('Fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  const resetForm = () => {
    setName(''); setTriggerType('region_strong'); setTriggerRegion('');
    setTriggerMinConf(6); setTriggerNeedsPonta(true); setTriggerNumber('');
    setTriggerMinRepeats(2); setEntryNumbers(''); setAttempts(3);
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (s) => {
    setName(s.name);
    setTriggerType(s.condition_type || 'region_strong');
    const p = s.condition_params || {};
    setTriggerRegion(p.region || '');
    setTriggerMinConf(p.min_confirmations || 6);
    setTriggerNeedsPonta(p.needs_ponta !== false);
    setTriggerNumber(p.number !== undefined ? String(p.number) : '');
    setTriggerMinRepeats(p.min_repeats || 2);
    const nums = s.action_params?.numbers || [];
    setEntryNumbers(nums.join(', '));
    setAttempts(s.attempts || 3);
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const nums = entryNumbers.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n <= 36);
    if (nums.length === 0 && triggerType !== 'fb_pattern') return;

    const condParams = {};
    if (triggerType === 'region_strong') {
      condParams.region = triggerRegion || '';
      condParams.min_confirmations = triggerMinConf;
      condParams.needs_ponta = triggerNeedsPonta;
    } else if (triggerType === 'number_repeated') {
      condParams.number = parseInt(triggerNumber) || 0;
      condParams.min_repeats = triggerMinRepeats;
    } else if (triggerType === 'specific_number') {
      condParams.number = parseInt(triggerNumber) || 0;
      condParams.needs_ponta = triggerNeedsPonta;
    }

    const body = {
      name: name.trim(),
      is_active: true,
      condition_type: triggerType,
      condition_params: condParams,
      action_type: 'custom_numbers',
      action_params: { numbers: nums },
      attempts,
    };

    try {
      if (editingId) {
        await strategiesApi.update(editingId, body);
      } else {
        await strategiesApi.create(body);
      }
      await fetchStrategies();
      resetForm();
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  const handleToggle = async (s) => {
    try {
      await strategiesApi.update(s.id, { is_active: !s.is_active });
      await fetchStrategies();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await strategiesApi.remove(id);
      await fetchStrategies();
    } catch (e) { console.error(e); }
  };

  const getTriggerDesc = (s) => {
    const p = s.condition_params || {};
    switch (s.condition_type) {
      case 'region_strong':
        return `Região ${p.region || 'mais forte'} com ${p.min_confirmations || 6}+ confirmações${p.needs_ponta ? ' + número na ponta' : ''}`;
      case 'number_repeated':
        return `Número ${p.number ?? '?'} repetiu ${p.min_repeats || 2}x`;
      case 'fb_pattern':
        return 'Estratégia FB formou padrão';
      case 'specific_number':
        return `Número ${p.number ?? '?'} saiu${p.needs_ponta ? ' na ponta' : ''}`;
      default: return s.condition_type;
    }
  };

  const NumberBall = ({ n, size = 28 }) => (
    <div className="inline-flex items-center justify-center rounded-full text-white font-bold"
      style={{ background: getBgColor(n), minWidth: size, height: size, fontSize: size * 0.4, border: '2px solid #D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.4)' }}>
      {n}
    </div>
  );

  return (
    <div className="min-h-screen bg-black p-4" data-testid="strategies-panel">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-[#D4AF37] hover:text-white" data-testid="strategies-back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[#D4AF37] font-bold text-xl">PAINEL DE ESTRATÉGIAS</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="ml-auto flex items-center gap-1 px-4 py-2 bg-black border-2 border-[#D4AF37] rounded-lg text-[#D4AF37] font-bold text-sm hover:bg-[rgba(212,175,55,0.1)]"
          data-testid="strategies-add">
          <Plus className="w-4 h-4" /> Nova Estratégia
        </button>
      </div>

      {showForm && (
        <div className="card-glass border-2 border-[#D4AF37] p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#D4AF37] font-bold text-lg">{editingId ? 'EDITAR' : 'CRIAR'} ESTRATÉGIA</h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="text-sm text-[#D4AF37] font-bold block mb-1">NOME DA ESTRATÉGIA</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Repetição do 4, Região 8/3 na Ponta..."
              className="w-full p-3 bg-black border-2 border-[#D4AF37] rounded-lg text-white" data-testid="strategy-name" />
          </div>

          {/* Trigger */}
          <div className="mb-4 p-4 bg-[rgba(212,175,55,0.05)] border border-[#333] rounded-lg">
            <label className="text-sm text-[#D4AF37] font-bold block mb-2">QUANDO ATIVAR (GATILHO)</label>
            <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}
              className="w-full p-3 bg-black border-2 border-[#D4AF37] rounded-lg text-white mb-3" data-testid="strategy-trigger-type">
              {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            {triggerType === 'region_strong' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Qual região?</label>
                  <select value={triggerRegion} onChange={(e) => setTriggerRegion(e.target.value)}
                    className="w-full p-2 bg-black border border-[#D4AF37] rounded-lg text-white text-sm">
                    <option value="">Qualquer (a mais forte)</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Mínimo de confirmações</label>
                  <input type="number" value={triggerMinConf} onChange={(e) => setTriggerMinConf(parseInt(e.target.value)||6)}
                    className="w-full p-2 bg-black border border-[#D4AF37] rounded-lg text-white text-sm" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={triggerNeedsPonta} onChange={(e) => setTriggerNeedsPonta(e.target.checked)}
                    className="w-4 h-4 accent-[#D4AF37]" />
                  <span className="text-sm text-white">Número da região precisa estar na ponta (último digitado)</span>
                </label>
              </div>
            )}

            {triggerType === 'number_repeated' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Qual número? (0-36)</label>
                  <input type="number" min="0" max="36" value={triggerNumber} onChange={(e) => setTriggerNumber(e.target.value)}
                    placeholder="Ex: 4" className="w-full p-2 bg-black border border-[#D4AF37] rounded-lg text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Quantas vezes precisa repetir?</label>
                  <input type="number" min="2" max="10" value={triggerMinRepeats} onChange={(e) => setTriggerMinRepeats(parseInt(e.target.value)||2)}
                    className="w-full p-2 bg-black border border-[#D4AF37] rounded-lg text-white text-sm" />
                </div>
              </div>
            )}

            {triggerType === 'fb_pattern' && (
              <div className="text-sm text-gray-400 py-2">Ativa automaticamente quando a Estratégia FB detectar um padrão nos números digitados.</div>
            )}

            {triggerType === 'specific_number' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Qual número? (0-36)</label>
                  <input type="number" min="0" max="36" value={triggerNumber} onChange={(e) => setTriggerNumber(e.target.value)}
                    placeholder="Ex: 14" className="w-full p-2 bg-black border border-[#D4AF37] rounded-lg text-white text-sm" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={triggerNeedsPonta} onChange={(e) => setTriggerNeedsPonta(e.target.checked)}
                    className="w-4 h-4 accent-[#D4AF37]" />
                  <span className="text-sm text-white">Precisa estar na ponta (último digitado)</span>
                </label>
              </div>
            )}
          </div>

          {/* Entry Numbers */}
          <div className="mb-4 p-4 bg-[rgba(212,175,55,0.05)] border border-[#333] rounded-lg">
            <label className="text-sm text-[#D4AF37] font-bold block mb-2">NÚMEROS PARA ENTRAR</label>
            <input type="text" value={entryNumbers} onChange={(e) => setEntryNumbers(e.target.value)}
              placeholder="Digite os números separados por vírgula: 4, 21, 3, 1"
              className="w-full p-3 bg-black border-2 border-[#D4AF37] rounded-lg text-white" data-testid="strategy-numbers" />
            {entryNumbers && (
              <div className="flex flex-wrap gap-1 mt-2">
                {entryNumbers.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n <= 36).map((n, i) => (
                  <NumberBall key={i} n={n} />
                ))}
              </div>
            )}
          </div>

          {/* Attempts */}
          <div className="mb-4">
            <label className="text-sm text-[#D4AF37] font-bold block mb-1">TENTATIVAS</label>
            <input type="number" value={attempts} onChange={(e) => setAttempts(parseInt(e.target.value)||3)} min="1" max="10"
              className="w-24 p-3 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-center" data-testid="strategy-attempts" />
          </div>

          <button onClick={handleSave}
            className="flex items-center gap-2 px-8 py-3 bg-[#D4AF37] rounded-lg text-black font-bold hover:bg-[#c9a430]"
            data-testid="strategy-save">
            <Save className="w-4 h-4" /> SALVAR ESTRATÉGIA
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">Carregando...</div>
      ) : strategies.length === 0 && !showForm ? (
        <div className="card-glass border-2 border-[#333] text-center py-10">
          <div className="text-gray-500 text-sm">Nenhuma estratégia criada</div>
          <div className="text-gray-600 text-xs mt-1">Clique em "Nova Estratégia" para começar</div>
        </div>
      ) : (
        <div className="space-y-3">
          {strategies.map(s => (
            <div key={s.id} className={`card-glass border-2 p-4 ${s.is_active ? 'border-[#D4AF37]' : 'border-[#333] opacity-50'}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => handleToggle(s)} className="shrink-0 mt-1">
                  {s.is_active ? <ToggleRight className="w-7 h-7 text-[#D4AF37]" /> : <ToggleLeft className="w-7 h-7 text-gray-600" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold">{s.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    <span className="text-[#D4AF37]">Gatilho:</span> {getTriggerDesc(s)}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-[#D4AF37] mr-1 self-center">Entrada:</span>
                    {(s.action_params?.numbers || []).map((n, i) => <NumberBall key={i} n={n} size={26} />)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{s.attempts} tentativas</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(s)} className="p-2 text-gray-400 hover:text-[#D4AF37]"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategiesPanel;
