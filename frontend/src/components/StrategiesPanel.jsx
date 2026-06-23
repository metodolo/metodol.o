/**
 * Strategies Panel - Admin only
 * CRUD for signal strategies stored in MongoDB
 */
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { ChevronLeft, Plus, Trash2, ToggleLeft, ToggleRight, Save, Edit2, X } from "lucide-react";
import { strategiesApi } from "../services/api";

const CONDITION_TYPES = [
  { value: 'region', label: 'Região com X+ confirmações' },
  { value: 'number_repeated', label: 'Número repetiu X vezes' },
  { value: 'fb_pattern', label: 'Estratégia FB formou padrão' },
  { value: 'terminal_weight', label: 'Terminal com peso X+' },
  { value: 'color_streak', label: 'Cor saiu X vezes seguidas' },
  { value: 'highlow_streak', label: 'Alto/Médio/Baixo saiu X vezes seguidas' },
  { value: 'specific_number', label: 'Número específico saiu' },
];

const ACTION_TYPES = [
  { value: 'region_numbers', label: 'Entrar nos números da região mais forte' },
  { value: 'terminal_family', label: 'Entrar na família do terminal mais forte' },
  { value: 'fb_entry', label: 'Entrar nos números da entrada FB' },
  { value: 'custom_numbers', label: 'Números personalizados' },
  { value: 'repeated_number', label: 'Entrar no número que repetiu' },
];

const REGIONS = ['6/5', '1/4', '8/3', '7/2', '9/0'];
const COLORS = ['vermelho', 'preto'];
const HIGHLOWS = ['alto', 'medio', 'baixo'];

const StrategiesPanel = ({ onBack }) => {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [conditionType, setConditionType] = useState('region');
  const [conditionParams, setConditionParams] = useState({});
  const [actionType, setActionType] = useState('region_numbers');
  const [actionParams, setActionParams] = useState({});
  const [attempts, setAttempts] = useState(3);

  const fetchStrategies = useCallback(async () => {
    try {
      const res = await strategiesApi.list();
      setStrategies(res.strategies || []);
    } catch (e) {
      console.error('Failed to fetch strategies:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  const resetForm = () => {
    setName('');
    setConditionType('region');
    setConditionParams({});
    setActionType('region_numbers');
    setActionParams({});
    setAttempts(3);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (s) => {
    setName(s.name);
    setConditionType(s.condition_type);
    setConditionParams(s.condition_params || {});
    setActionType(s.action_type);
    setActionParams(s.action_params || {});
    setAttempts(s.attempts || 3);
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const body = {
      name: name.trim(),
      is_active: true,
      condition_type: conditionType,
      condition_params: conditionParams,
      action_type: actionType,
      action_params: actionParams,
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
    } catch (e) {
      console.error('Toggle failed:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await strategiesApi.remove(id);
      await fetchStrategies();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  // Condition params UI
  const ConditionParamsEditor = () => {
    switch (conditionType) {
      case 'region':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Região</label>
            <select value={conditionParams.region || ''} onChange={(e) => setConditionParams({...conditionParams, region: e.target.value})}
              className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm">
              <option value="">Qualquer (a mais forte)</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <label className="text-xs text-gray-400">Mínimo de confirmações</label>
            <input type="number" value={conditionParams.min_count || 6} onChange={(e) => setConditionParams({...conditionParams, min_count: parseInt(e.target.value)||6})}
              className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm" />
          </div>
        );
      case 'number_repeated':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Mínimo de repetições</label>
            <input type="number" value={conditionParams.min_repeats || 2} onChange={(e) => setConditionParams({...conditionParams, min_repeats: parseInt(e.target.value)||2})}
              className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm" />
          </div>
        );
      case 'fb_pattern':
        return <div className="text-xs text-gray-400 py-2">Ativa quando a Estratégia FB detectar um padrão</div>;
      case 'terminal_weight':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Peso mínimo do terminal</label>
            <input type="number" value={conditionParams.min_weight || 20} onChange={(e) => setConditionParams({...conditionParams, min_weight: parseInt(e.target.value)||20})}
              className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm" />
          </div>
        );
      case 'color_streak':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Cor</label>
            <select value={conditionParams.color || 'vermelho'} onChange={(e) => setConditionParams({...conditionParams, color: e.target.value})}
              className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm">
              {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="text-xs text-gray-400">Vezes seguidas</label>
            <input type="number" value={conditionParams.min_streak || 5} onChange={(e) => setConditionParams({...conditionParams, min_streak: parseInt(e.target.value)||5})}
              className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm" />
          </div>
        );
      case 'highlow_streak':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Tipo</label>
            <select value={conditionParams.type || 'alto'} onChange={(e) => setConditionParams({...conditionParams, type: e.target.value})}
              className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm">
              {HIGHLOWS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <label className="text-xs text-gray-400">Vezes seguidas</label>
            <input type="number" value={conditionParams.min_streak || 4} onChange={(e) => setConditionParams({...conditionParams, min_streak: parseInt(e.target.value)||4})}
              className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm" />
          </div>
        );
      case 'specific_number':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Número (0-36)</label>
            <input type="number" min="0" max="36" value={conditionParams.number ?? ''} onChange={(e) => setConditionParams({...conditionParams, number: parseInt(e.target.value)})}
              className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm" />
          </div>
        );
      default:
        return null;
    }
  };

  // Action params UI
  const ActionParamsEditor = () => {
    switch (actionType) {
      case 'custom_numbers':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Números (separados por vírgula)</label>
            <input type="text" placeholder="Ex: 5, 14, 23, 32"
              value={(actionParams.numbers || []).join(', ')}
              onChange={(e) => {
                const nums = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n <= 36);
                setActionParams({...actionParams, numbers: nums});
              }}
              className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm" />
          </div>
        );
      case 'region_numbers':
        return <div className="text-xs text-gray-400 py-2">Mostra os números da região mais forte nos 14 giros</div>;
      case 'terminal_family':
        return <div className="text-xs text-gray-400 py-2">Mostra a família do terminal mais forte</div>;
      case 'fb_entry':
        return <div className="text-xs text-gray-400 py-2">Mostra os números de entrada da Estratégia FB</div>;
      case 'repeated_number':
        return <div className="text-xs text-gray-400 py-2">Mostra o número que repetiu e sua família</div>;
      default:
        return null;
    }
  };

  const getConditionLabel = (s) => {
    const p = s.condition_params || {};
    switch (s.condition_type) {
      case 'region': return `Região ${p.region || 'mais forte'} com ${p.min_count || 6}+ confirmações`;
      case 'number_repeated': return `Número repetiu ${p.min_repeats || 2}x`;
      case 'fb_pattern': return 'FB formou padrão';
      case 'terminal_weight': return `Terminal com peso ${p.min_weight || 20}+`;
      case 'color_streak': return `${p.color || 'vermelho'} ${p.min_streak || 5}x seguidas`;
      case 'highlow_streak': return `${p.type || 'alto'} ${p.min_streak || 4}x seguidas`;
      case 'specific_number': return `Número ${p.number ?? '?'} saiu`;
      default: return s.condition_type;
    }
  };

  const getActionLabel = (s) => {
    const p = s.action_params || {};
    switch (s.action_type) {
      case 'region_numbers': return 'Entrar na região';
      case 'terminal_family': return 'Entrar na família do terminal';
      case 'fb_entry': return 'Entrar na entrada FB';
      case 'custom_numbers': return `Entrar em [${(p.numbers || []).join(', ')}]`;
      case 'repeated_number': return 'Entrar no número repetido';
      default: return s.action_type;
    }
  };

  return (
    <div className="min-h-screen bg-black p-4" data-testid="strategies-panel">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-[#D4AF37] hover:text-white transition-colors" data-testid="strategies-back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[#D4AF37] font-bold text-xl">PAINEL DE ESTRATÉGIAS</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="ml-auto flex items-center gap-1 px-4 py-2 bg-black border-2 border-[#D4AF37] rounded-lg text-[#D4AF37] font-bold text-sm hover:bg-[rgba(212,175,55,0.1)] transition-colors"
          data-testid="strategies-add">
          <Plus className="w-4 h-4" /> Nova Estratégia
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-glass border-2 border-[#D4AF37] p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#D4AF37] font-bold">{editingId ? 'EDITAR' : 'NOVA'} ESTRATÉGIA</h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400">Nome da Estratégia</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Região 8/3 na Ponta"
                className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm mt-1" data-testid="strategy-name" />
            </div>

            {/* Condition */}
            <div>
              <label className="text-xs text-[#D4AF37] font-bold">QUANDO (Condição)</label>
              <select value={conditionType} onChange={(e) => { setConditionType(e.target.value); setConditionParams({}); }}
                className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm mt-1" data-testid="strategy-condition">
                {CONDITION_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className="mt-2"><ConditionParamsEditor /></div>
            </div>

            {/* Action */}
            <div>
              <label className="text-xs text-[#D4AF37] font-bold">ENTÃO (Ação nos Sinais)</label>
              <select value={actionType} onChange={(e) => { setActionType(e.target.value); setActionParams({}); }}
                className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm mt-1" data-testid="strategy-action">
                {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              <div className="mt-2"><ActionParamsEditor /></div>
            </div>

            {/* Attempts */}
            <div>
              <label className="text-xs text-gray-400">Tentativas</label>
              <input type="number" value={attempts} onChange={(e) => setAttempts(parseInt(e.target.value)||3)} min="1" max="10"
                className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-sm mt-1" data-testid="strategy-attempts" />
            </div>
          </div>

          <button onClick={handleSave}
            className="mt-4 flex items-center gap-2 px-6 py-2 bg-[#D4AF37] rounded-lg text-black font-bold text-sm hover:bg-[#c9a430] transition-colors"
            data-testid="strategy-save">
            <Save className="w-4 h-4" /> SALVAR
          </button>
        </div>
      )}

      {/* Strategy List */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">Carregando...</div>
      ) : strategies.length === 0 ? (
        <div className="card-glass text-center py-8">
          <div className="text-gray-600 text-sm">Nenhuma estratégia criada</div>
          <div className="text-gray-700 text-xs mt-1">Clique em "Nova Estratégia" para começar</div>
        </div>
      ) : (
        <div className="space-y-2">
          {strategies.map(s => (
            <div key={s.id} className={`card-glass border-2 p-3 flex items-center gap-3 ${s.is_active ? 'border-[#D4AF37]' : 'border-[#333] opacity-60'}`}>
              {/* Toggle */}
              <button onClick={() => handleToggle(s)} className="shrink-0" data-testid={`toggle-${s.id}`}>
                {s.is_active ? <ToggleRight className="w-6 h-6 text-[#D4AF37]" /> : <ToggleLeft className="w-6 h-6 text-gray-600" />}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm">{s.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  <span className="text-[#D4AF37]">Quando:</span> {getConditionLabel(s)}
                  <span className="mx-2">|</span>
                  <span className="text-[#D4AF37]">Então:</span> {getActionLabel(s)}
                  <span className="mx-2">|</span>
                  <span>{s.attempts} tentativas</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(s)} className="p-1.5 text-gray-400 hover:text-[#D4AF37] transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" data-testid={`delete-${s.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategiesPanel;
