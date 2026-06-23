/**
 * Strategies Panel - Admin only - Free-form strategy builder with condition blocks
 */
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Plus, Trash2, ToggleLeft, ToggleRight, Save, Edit2, X, PlusCircle, MinusCircle } from "lucide-react";
import { strategiesApi } from "../services/api";
import { getBgColor } from "../engine/radarEngine";

const CONDITION_BLOCKS = [
  { value: 'region_count', label: 'Região com X confirmações' },
  { value: 'region_ponta', label: 'Número da região na ponta' },
  { value: 'number_repeated', label: 'Número repetiu X vezes' },
  { value: 'specific_number_ponta', label: 'Número específico na ponta' },
  { value: 'fb_pattern', label: 'Estratégia FB formou padrão' },
  { value: 'terminal_weight', label: 'Terminal com peso X+' },
];

const NumberBall = ({ n, size = 28 }) => (
  <div className="inline-flex items-center justify-center rounded-full text-white font-bold"
    style={{ background: getBgColor(n), minWidth: size, height: size, fontSize: size * 0.4, border: '2px solid #D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.4)' }}>
    {n}
  </div>
);

const StrategiesPanel = ({ onBack }) => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [conditions, setConditions] = useState([]);
  const [entryNumbers, setEntryNumbers] = useState('');
  const [attempts, setAttempts] = useState(3);

  const fetchStrategies = useCallback(async () => {
    try {
      const res = await strategiesApi.list();
      setStrategies(res.strategies || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  const resetForm = () => {
    setName(''); setConditions([]); setEntryNumbers(''); setAttempts(3);
    setEditingId(null); setShowForm(false);
  };

  const addCondition = () => {
    setConditions([...conditions, { type: 'region_count', region: '', min_count: 6, number: '', min_repeats: 2, min_weight: 20 }]);
  };

  const updateCondition = (idx, field, value) => {
    const updated = [...conditions];
    updated[idx] = { ...updated[idx], [field]: value };
    setConditions(updated);
  };

  const removeCondition = (idx) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const startEdit = (s) => {
    setName(s.name);
    setConditions(s.condition_params?.conditions || []);
    setEntryNumbers((s.action_params?.numbers || []).join(', '));
    setAttempts(s.attempts || 3);
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim() || conditions.length === 0) return;
    const nums = entryNumbers.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n <= 36);
    if (nums.length === 0) return;

    const body = {
      name: name.trim(),
      is_active: true,
      condition_type: 'multi',
      condition_params: { conditions },
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
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (s) => {
    try {
      await strategiesApi.update(s.id, { is_active: !s.is_active });
      await fetchStrategies();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try { await strategiesApi.remove(id); await fetchStrategies(); }
    catch (e) { console.error(e); }
  };

  const getConditionDesc = (c) => {
    switch (c.type) {
      case 'region_count': return `Região ${c.region || '?'} com ${c.min_count || 6}+ confirmações`;
      case 'region_ponta': return `Número da região ${c.region || '?'} na ponta`;
      case 'number_repeated': return `Número ${c.number ?? '?'} repetiu ${c.min_repeats || 2}x`;
      case 'specific_number_ponta': return `Número ${c.number ?? '?'} na ponta`;
      case 'fb_pattern': return 'Estratégia FB formou padrão';
      case 'terminal_weight': return `Terminal com peso ${c.min_weight || 20}+`;
      default: return c.type;
    }
  };

  const ConditionBlock = ({ cond, idx }) => (
    <div className="p-3 bg-[rgba(0,0,0,0.5)] border border-[#555] rounded-lg mb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#D4AF37] text-xs font-bold">CONDIÇÃO {idx + 1}</span>
        <button onClick={() => removeCondition(idx)} className="text-red-500 hover:text-red-300">
          <MinusCircle className="w-4 h-4" />
        </button>
      </div>

      <select value={cond.type} onChange={(e) => updateCondition(idx, 'type', e.target.value)}
        className="w-full p-2 bg-black border border-[#D4AF37] rounded-lg text-white text-sm mb-2">
        {CONDITION_BLOCKS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      {(cond.type === 'region_count' || cond.type === 'region_ponta') && (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-gray-400">Qual região? (digite: ex 8/3)</label>
            <input type="text" value={cond.region || ''} onChange={(e) => updateCondition(idx, 'region', e.target.value)}
              placeholder="Ex: 8/3, 7/2, 6/5..." className="w-full p-2 bg-black border border-[#666] rounded-lg text-white text-sm" />
          </div>
          {cond.type === 'region_count' && (
            <div>
              <label className="text-[10px] text-gray-400">Mínimo de confirmações</label>
              <input type="number" value={cond.min_count || 6} onChange={(e) => updateCondition(idx, 'min_count', parseInt(e.target.value) || 6)}
                className="w-full p-2 bg-black border border-[#666] rounded-lg text-white text-sm" />
            </div>
          )}
        </div>
      )}

      {cond.type === 'number_repeated' && (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-gray-400">Qual número? (0-36)</label>
            <input type="number" min="0" max="36" value={cond.number ?? ''} onChange={(e) => updateCondition(idx, 'number', e.target.value)}
              placeholder="Ex: 4" className="w-full p-2 bg-black border border-[#666] rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400">Quantas vezes repetiu?</label>
            <input type="number" min="2" max="14" value={cond.min_repeats || 2} onChange={(e) => updateCondition(idx, 'min_repeats', parseInt(e.target.value) || 2)}
              className="w-full p-2 bg-black border border-[#666] rounded-lg text-white text-sm" />
          </div>
        </div>
      )}

      {cond.type === 'specific_number_ponta' && (
        <div>
          <label className="text-[10px] text-gray-400">Qual número na ponta? (0-36)</label>
          <input type="number" min="0" max="36" value={cond.number ?? ''} onChange={(e) => updateCondition(idx, 'number', e.target.value)}
            placeholder="Ex: 14" className="w-full p-2 bg-black border border-[#666] rounded-lg text-white text-sm" />
        </div>
      )}

      {cond.type === 'fb_pattern' && (
        <div className="text-xs text-gray-400 py-1">Ativa quando a Estratégia FB detectar um padrão</div>
      )}

      {cond.type === 'terminal_weight' && (
        <div>
          <label className="text-[10px] text-gray-400">Peso mínimo do terminal</label>
          <input type="number" value={cond.min_weight || 20} onChange={(e) => updateCondition(idx, 'min_weight', parseInt(e.target.value) || 20)}
            className="w-full p-2 bg-black border border-[#666] rounded-lg text-white text-sm" />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black p-4" data-testid="strategies-panel">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-[#D4AF37] hover:text-white" data-testid="strategies-back">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[#D4AF37] font-bold text-xl">PAINEL DE ESTRATÉGIAS</h1>
        <button onClick={() => { resetForm(); setShowForm(true); addCondition(); }}
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
            <label className="text-sm text-[#D4AF37] font-bold block mb-1">NOME</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Região 8/3 na Ponta com Repetição"
              className="w-full p-3 bg-black border-2 border-[#D4AF37] rounded-lg text-white" data-testid="strategy-name" />
          </div>

          {/* Conditions */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[#D4AF37] font-bold">CONDIÇÕES (QUANDO ATIVAR)</label>
              <button onClick={addCondition} className="flex items-center gap-1 text-xs text-[#D4AF37] hover:text-white">
                <PlusCircle className="w-4 h-4" /> Adicionar
              </button>
            </div>
            <div className="text-[10px] text-gray-500 mb-2">Todas as condições precisam ser verdadeiras para o sinal ativar</div>
            {conditions.map((c, i) => <ConditionBlock key={i} cond={c} idx={i} />)}
            {conditions.length === 0 && (
              <div className="text-center text-gray-600 text-sm py-3 border border-dashed border-[#333] rounded-lg">
                Clique em "Adicionar" para criar condições
              </div>
            )}
          </div>

          {/* Entry Numbers */}
          <div className="mb-4">
            <label className="text-sm text-[#D4AF37] font-bold block mb-1">NÚMEROS PARA ENTRAR</label>
            <input type="text" value={entryNumbers} onChange={(e) => setEntryNumbers(e.target.value)}
              placeholder="Digite separado por vírgula: 8, 26, 35, 0, 3, 12, 30, 28"
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
            <input type="number" value={attempts} onChange={(e) => setAttempts(parseInt(e.target.value) || 3)} min="1" max="10"
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
          {strategies.map(s => {
            const conds = s.condition_params?.conditions || [];
            return (
              <div key={s.id} className={`card-glass border-2 p-4 ${s.is_active ? 'border-[#D4AF37]' : 'border-[#333] opacity-50'}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggle(s)} className="shrink-0 mt-1">
                    {s.is_active ? <ToggleRight className="w-7 h-7 text-[#D4AF37]" /> : <ToggleLeft className="w-7 h-7 text-gray-600" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold">{s.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {conds.map((c, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-[#D4AF37]"> + </span>}
                          {getConditionDesc(c)}
                        </span>
                      ))}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StrategiesPanel;
