/**
 * Gestao Tab Component - Bank management
 * Faithfully replicates the original HTML logic
 */
import React, { useState, useEffect, useRef } from "react";
import { Line } from "recharts";
import { LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const STORAGE_KEY = "dadosGestaoFH_AutoV1";

const GestaoTab = () => {
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
      localStorage.removeItem(STORAGE_KEY);
      setBancaAtual(bancaInicial);
      setDiaAtual(1);
      setMetas(0);
      setStops(0);
      setHistoricoBanca([bancaInicial]);
      setHistoricoValores([]);
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

  return (
    <div className="space-y-3" data-testid="gestao-tab">
      {/* Header */}
      <div className="gestao-header">Método L.O</div>

      {/* Score */}
      <div className="grid grid-cols-2 gap-2">
        <div className="placar-item-meta">
          <small className="text-[#00ff95] font-bold">DIAS META</small>
          <br />
          <span className="text-3xl font-bold" data-testid="count-meta">{metas}</span>
        </div>
        <div className="placar-item-stop">
          <small className="text-[#ff3131] font-bold">DIAS STOP</small>
          <br />
          <span className="text-3xl font-bold" data-testid="count-stop">{stops}</span>
        </div>
      </div>

      {/* Config card */}
      <div className="card-glass">
        {/* Inputs */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="text-[9px] text-gray-400">INICIAL</label>
            <input
              type="number"
              value={bancaInicial}
              onChange={(e) => setBancaInicial(parseFloat(e.target.value) || 0)}
              className="input-dark"
              data-testid="input-inicial"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-400">META %</label>
            <input
              type="number"
              value={metaPercent}
              onChange={(e) => setMetaPercent(parseFloat(e.target.value) || 0)}
              className="input-dark"
              data-testid="input-meta"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-400">STOP %</label>
            <input
              type="number"
              value={stopPercent}
              onChange={(e) => setStopPercent(parseFloat(e.target.value) || 0)}
              className="input-dark"
              data-testid="input-stop"
            />
          </div>
        </div>

        {/* Current balance */}
        <div className="text-center mb-3">
          <small className="text-gray-400">BANCA ATUAL</small>
          <br />
          <span className="text-2xl font-bold text-[#00ff95]" data-testid="banca-atual">
            R$ {bancaAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Optional value input */}
        <div className="bg-[rgba(255,255,255,0.05)] p-2 rounded-lg text-center mb-3 border border-[#00ff95]">
          <small className="text-[#00ff95]">VALOR DIFERENTE? (OPCIONAL)</small>
          <input
            type="number"
            placeholder="Vazio = Automático"
            value={valorRealInput}
            onChange={(e) => setValorRealInput(e.target.value)}
            className="input-dark mt-2 w-[80%]"
            data-testid="input-valor-real"
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => registrarAcao("meta")}
            className="btn-gestao bg-[#00ff95] text-black"
            data-testid="btn-ganhei"
          >
            ✅ GANHEI
          </button>
          <button
            onClick={() => registrarAcao("stop")}
            className="btn-gestao bg-[#ff3131] text-white"
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
                stroke="#00ff95"
                strokeWidth={2}
                dot={false}
                fill="rgba(0, 255, 149, 0.05)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Table header */}
        <div className="day-row day-header">
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
              <div>{row.dia}</div>
              <div>{row.inicio}</div>
              <div className="text-[#00ff95]">{row.meta}</div>
              <div className="text-[#ff3131]">{row.stop}</div>
              <div>{row.final}</div>
            </div>
          ))}
        </div>

        {/* Reset button */}
        <button
          onClick={zerarTudo}
          className="w-full mt-5 text-[10px] text-gray-500 bg-transparent border-none cursor-pointer"
          data-testid="btn-reset"
        >
          REINICIAR TUDO
        </button>
      </div>
    </div>
  );
};

export default GestaoTab;
