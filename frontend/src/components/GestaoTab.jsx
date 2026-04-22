/**
 * Gestao Tab Component - Bank management
 * Faithfully replicates the original HTML logic
 */
import React, { useState, useEffect, useRef } from "react";
import { Line } from "recharts";
import { LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const STORAGE_KEY = "dadosGestaoFH_AutoV1";

const GestaoTab = ({ viewMode = "vertical" }) => {
  const [bancaInicial, setBancaInicial] = useState(500);
  const [metaPercent, setMetaPercent] = useState(10);
  const [stopPercent, setStopPercent] = useState(15);
  const [valorRealInput, setValorRealInput] = useState("");

  const [bancaAtual, setBancaAtual] = useState(500);
  const [diaAtual, setDiaAtual] = useState(1);
  const [metas, setMetas] = useState(0);
  const [stops, setStops] = useState(0);
  const [historicoBanca, setHistoricoBanca] = useState([500]);
  const [historicoValores, setHistoricoValores] = useState([]);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setBancaAtual(data.bancaAtual || 500);
        setDiaAtual(data.diaAtual || 1);
        setMetas(data.metas || 0);
        setStops(data.stops || 0);
        setHistoricoBanca(data.historicoBanca || [500]);
        setHistoricoValores(data.historicoValores || []);
        setBancaInicial(parseFloat(data.inpBanca) || 500);
        setMetaPercent(parseFloat(data.inpMeta) || 10);
        setStopPercent(parseFloat(data.inpStop) || 15);
      } catch (e) {
        console.error("Error loading gestao data:", e);
      }
    }
  }, []);

  // Auto-save when state changes
  useEffect(() => {
    const dataToSave = {
      bancaAtual,
      diaAtual,
      metas,
      stops,
      historicoBanca,
      historicoValores,
      inpBanca: String(bancaInicial),
      inpMeta: String(metaPercent),
      inpStop: String(stopPercent),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [bancaInicial, metaPercent, stopPercent, bancaAtual, diaAtual, metas, stops, historicoBanca, historicoValores]);

  // Save data
  const saveData = (newData) => {
    const dataToSave = {
      bancaAtual: newData.bancaAtual ?? bancaAtual,
      diaAtual: newData.diaAtual ?? diaAtual,
      metas: newData.metas ?? metas,
      stops: newData.stops ?? stops,
      historicoBanca: newData.historicoBanca ?? historicoBanca,
      historicoValores: newData.historicoValores ?? historicoValores,
      inpBanca: String(bancaInicial),
      inpMeta: String(metaPercent),
      inpStop: String(stopPercent),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  };

  // Register action (win/loss)
  const registrarAcao = (tipo) => {
    const mPerc = metaPercent / 100;
    const sPerc = stopPercent / 100;
    let valorManual = parseFloat(valorRealInput);

    let valorFinal;
    let newBanca;
    let newMetas = metas;
    let newStops = stops;
    let newHistoricoValores = [...historicoValores];

    if (tipo === "meta") {
      valorFinal = isNaN(valorManual) ? bancaAtual * mPerc : valorManual;
      newBanca = bancaAtual + valorFinal;
      newMetas = metas + 1;
      newHistoricoValores.push({ tipo: "meta", valor: valorFinal });
    } else {
      valorFinal = isNaN(valorManual) ? bancaAtual * sPerc : valorManual;
      newBanca = bancaAtual - valorFinal;
      newStops = stops + 1;
      newHistoricoValores.push({ tipo: "stop", valor: valorFinal });
    }

    const newDia = diaAtual + 1;
    const newHistoricoBanca = [...historicoBanca, newBanca];

    setBancaAtual(newBanca);
    setDiaAtual(newDia);
    setMetas(newMetas);
    setStops(newStops);
    setHistoricoBanca(newHistoricoBanca);
    setHistoricoValores(newHistoricoValores);
    setValorRealInput("");

    saveData({
      bancaAtual: newBanca,
      diaAtual: newDia,
      metas: newMetas,
      stops: newStops,
      historicoBanca: newHistoricoBanca,
      historicoValores: newHistoricoValores,
    });
  };

  // Reset everything
  const zerarTudo = () => {
    if (window.confirm("Zerar tudo?")) {
      // Clear localStorage first
      localStorage.removeItem(STORAGE_KEY);
      
      // Reset all states
      const valorInicial = bancaInicial || 500;
      setBancaAtual(valorInicial);
      setDiaAtual(1);
      setMetas(0);
      setStops(0);
      setHistoricoBanca([valorInicial]);
      setHistoricoValores([]);
      setValorRealInput("");
      
      // Save clean state immediately
      const cleanData = {
        bancaAtual: valorInicial,
        diaAtual: 1,
        metas: 0,
        stops: 0,
        historicoBanca: [valorInicial],
        historicoValores: [],
        inpBanca: String(bancaInicial),
        inpMeta: String(metaPercent),
        inpStop: String(stopPercent),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
    }
  };

  // Generate projection rows
  const generateRows = () => {
    const rows = [];
    const mPerc = metaPercent / 100;
    const sPerc = stopPercent / 100;
    let bancaLoop = bancaInicial;

    for (let i = 1; i <= 30; i++) {
      let vM_Projetado = bancaLoop * mPerc;
      let vS_Projetado = bancaLoop * sPerc;
      let bFinalDia;
      let cls = "";
      let icone = `D${i}`;

      if (i < diaAtual) {
        const dadoReal = historicoValores[i - 1];
        if (dadoReal?.tipo === "meta") {
          cls = "row-meta";
          icone = "✅";
          vM_Projetado = dadoReal.valor;
          vS_Projetado = 0;
          bFinalDia = bancaLoop + vM_Projetado;
        } else {
          cls = "row-stop";
          icone = "❌";
          vM_Projetado = 0;
          vS_Projetado = dadoReal?.valor || 0;
          bFinalDia = bancaLoop - vS_Projetado;
        }
      } else {
        if (i === diaAtual) cls = "row-atual";
        bFinalDia = bancaLoop + vM_Projetado;
      }

      rows.push({
        dia: icone,
        inicio: bancaLoop.toFixed(0),
        meta: `+${vM_Projetado.toFixed(0)}`,
        stop: `-${vS_Projetado.toFixed(0)}`,
        final: bFinalDia.toFixed(0),
        cls,
      });

      bancaLoop = bFinalDia;
    }

    return rows;
  };

  const rows = generateRows();

  // Chart data
  const chartData = historicoBanca.map((val, idx) => ({
    dia: idx,
    banca: val,
  }));

  const isHorizontal = viewMode === "horizontal";

  if (isHorizontal) {
    return (
      <div className="flex gap-2 h-full min-h-0 overflow-hidden" data-testid="gestao-tab">
        {/* Left Column: Controls */}
        <div className="flex flex-col gap-1 overflow-y-auto" style={{ width: "40%", scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 #111' }}>
          {/* Score */}
          <div className="grid grid-cols-2 gap-1">
            <div className="p-2 rounded-lg text-center bg-black border-2 border-[#D4AF37]">
              <small className="text-white font-bold text-xs">DIAS META</small>
              <br />
              <span className="text-xl font-bold text-white" data-testid="count-meta">{metas}</span>
            </div>
            <div className="p-2 rounded-lg text-center bg-black border-2 border-[#D4AF37]">
              <small className="text-white font-bold text-xs">DIAS STOP</small>
              <br />
              <span className="text-xl font-bold text-white" data-testid="count-stop">{stops}</span>
            </div>
          </div>

          <div className="card-glass !p-2">
            {/* Inputs */}
            <div className="grid grid-cols-3 gap-1 mb-2">
              <div>
                <label className="text-[8px] text-white">INICIAL</label>
                <input type="number" value={bancaInicial} onChange={(e) => setBancaInicial(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-center text-sm" data-testid="input-inicial" />
              </div>
              <div>
                <label className="text-[8px] text-white">META %</label>
                <input type="number" value={metaPercent} onChange={(e) => setMetaPercent(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-center text-sm" data-testid="input-meta" />
              </div>
              <div>
                <label className="text-[8px] text-white">STOP %</label>
                <input type="number" value={stopPercent} onChange={(e) => setStopPercent(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-center text-sm" data-testid="input-stop" />
              </div>
            </div>

            {/* Balance */}
            <div className="text-center mb-2">
              <small className="text-white text-xs">BANCA ATUAL</small>
              <br />
              <span className="text-lg font-bold text-white" data-testid="banca-atual">
                R$ {bancaAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Optional value */}
            <div className="bg-black p-1 rounded-lg text-center mb-2 border-2 border-[#D4AF37]">
              <small className="text-white text-[8px]">VALOR DIFERENTE? (OPCIONAL)</small>
              <input type="number" placeholder="Vazio = Automático" value={valorRealInput} onChange={(e) => setValorRealInput(e.target.value)}
                className="w-full mt-1 p-2 bg-black border border-[#D4AF37] rounded-lg text-white text-center text-sm" data-testid="input-valor-real" />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => registrarAcao("meta")}
                className="py-2 rounded-lg font-bold text-sm bg-black border-2 border-[#D4AF37] text-white hover:bg-gray-900" data-testid="btn-ganhei">
                GANHEI
              </button>
              <button onClick={() => registrarAcao("stop")}
                className="py-2 rounded-lg font-bold text-sm bg-black border-2 border-[#D4AF37] text-white hover:bg-gray-900" data-testid="btn-perdi">
                PERDI
              </button>
            </div>

            {/* Reset */}
            <button onClick={zerarTudo}
              className="w-full mt-2 py-2 text-xs text-white font-bold bg-black border-2 border-red-800 rounded-lg cursor-pointer hover:bg-red-900 transition-colors" data-testid="btn-reset">
              REINICIAR TUDO
            </button>
          </div>
        </div>

        {/* Right Column: Chart + Table */}
        <div className="flex flex-col gap-1 min-h-0 overflow-hidden" style={{ flex: 1 }}>
          {/* Chart */}
          <div className="card-glass !p-2 shrink-0" style={{ height: '180px' }} data-testid="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="dia" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: "8px" }} labelStyle={{ color: "#888" }} />
                <Line type="monotone" dataKey="banca" stroke="#D4AF37" strokeWidth={2} dot={false} fill="rgba(212, 175, 55, 0.1)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="card-glass !p-2 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="day-row day-header text-white text-xs">
              <div>DIA</div><div>INÍCIO</div><div>META(+)</div><div>STOP(-)</div><div>BANCA F.</div>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 #111' }} data-testid="projection-table">
              {rows.map((row, idx) => (
                <div key={idx} className={`day-row ${row.cls} text-xs`}>
                  <div className="text-white">{row.dia}</div>
                  <div className="text-white">{row.inicio}</div>
                  <div className="text-white">{row.meta}</div>
                  <div className="text-white">{row.stop}</div>
                  <div className="text-white">{row.final}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="gestao-tab">
      {/* Header */}
      <div className="text-center mb-4">
        <span className="logo-metodo-large">Método L.O</span>
      </div>

      {/* Score */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-4 rounded-xl text-center bg-black border-2 border-[#D4AF37]">
          <small className="text-white font-bold">DIAS META</small>
          <br />
          <span className="text-3xl font-bold text-white" data-testid="count-meta">{metas}</span>
        </div>
        <div className="p-4 rounded-xl text-center bg-black border-2 border-[#D4AF37]">
          <small className="text-white font-bold">DIAS STOP</small>
          <br />
          <span className="text-3xl font-bold text-white" data-testid="count-stop">{stops}</span>
        </div>
      </div>

      {/* Config card */}
      <div className="card-glass">
        {/* Inputs */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="text-[9px] text-white">INICIAL</label>
            <input
              type="number"
              value={bancaInicial}
              onChange={(e) => setBancaInicial(parseFloat(e.target.value) || 0)}
              className="w-full p-3 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-center"
              data-testid="input-inicial"
            />
          </div>
          <div>
            <label className="text-[9px] text-white">META %</label>
            <input
              type="number"
              value={metaPercent}
              onChange={(e) => setMetaPercent(parseFloat(e.target.value) || 0)}
              className="w-full p-3 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-center"
              data-testid="input-meta"
            />
          </div>
          <div>
            <label className="text-[9px] text-white">STOP %</label>
            <input
              type="number"
              value={stopPercent}
              onChange={(e) => setStopPercent(parseFloat(e.target.value) || 0)}
              className="w-full p-3 bg-black border-2 border-[#D4AF37] rounded-lg text-white text-center"
              data-testid="input-stop"
            />
          </div>
        </div>

        {/* Current balance */}
        <div className="text-center mb-3">
          <small className="text-white">BANCA ATUAL</small>
          <br />
          <span className="text-2xl font-bold text-white" data-testid="banca-atual">
            R$ {bancaAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Optional value input */}
        <div className="bg-black p-2 rounded-lg text-center mb-3 border-2 border-[#D4AF37]">
          <small className="text-white">VALOR DIFERENTE? (OPCIONAL)</small>
          <input
            type="number"
            placeholder="Vazio = Automático"
            value={valorRealInput}
            onChange={(e) => setValorRealInput(e.target.value)}
            className="w-[80%] mt-2 p-3 bg-black border border-[#D4AF37] rounded-lg text-white text-center"
            data-testid="input-valor-real"
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => registrarAcao("meta")}
            className="py-4 px-6 rounded-lg font-bold bg-black border-2 border-[#D4AF37] text-white hover:bg-gray-900"
            data-testid="btn-ganhei"
          >
            ✅ GANHEI
          </button>
          <button
            onClick={() => registrarAcao("stop")}
            className="py-4 px-6 rounded-lg font-bold bg-black border-2 border-[#D4AF37] text-white hover:bg-gray-900"
            data-testid="btn-perdi"
          >
            ❌ PERDI
          </button>
        </div>

        {/* Chart */}
        <div className="h-[180px] my-4" data-testid="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="dia" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#888" }}
              />
              <Line
                type="monotone"
                dataKey="banca"
                stroke="#D4AF37"
                strokeWidth={2}
                dot={false}
                fill="rgba(212, 175, 55, 0.1)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Table header */}
        <div className="day-row day-header text-white">
          <div>DIA</div>
          <div>INÍCIO</div>
          <div>META(+)</div>
          <div>STOP(-)</div>
          <div>BANCA F.</div>
        </div>

        {/* Table rows */}
        <div className="max-h-[300px] overflow-y-auto" data-testid="projection-table">
          {rows.map((row, idx) => (
            <div key={idx} className={`day-row ${row.cls}`}>
              <div className="text-white">{row.dia}</div>
              <div className="text-white">{row.inicio}</div>
              <div className="text-white">{row.meta}</div>
              <div className="text-white">{row.stop}</div>
              <div className="text-white">{row.final}</div>
            </div>
          ))}
        </div>

        {/* Reset button */}
        <button
          onClick={zerarTudo}
          className="w-full mt-5 py-3 text-sm text-white font-bold bg-black border-2 border-red-800 rounded-lg cursor-pointer hover:bg-red-900 transition-colors"
          data-testid="btn-reset"
        >
          REINICIAR TUDO
        </button>
      </div>
    </div>
  );
};

export default GestaoTab;
