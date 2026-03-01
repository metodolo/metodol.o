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

const RadarTab = () => {
  const [giros, setGiros] = useState([]);
  const [limiteGiros, setLimiteGiros] = useState(14);
  const [terminalSelecionado, setTerminalSelecionado] = useState(null);
  const painelRef = useRef(null);
  const isLoadedRef = useRef(false);

  // Load giros from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGiros(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading giros:", e);
      }
    }
    isLoadedRef.current = true;
  }, []);

  // Save giros to localStorage (only after initial load)
  useEffect(() => {
    if (isLoadedRef.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(giros));
    }
  }, [giros]);

  // Scroll to end when giros change
  useEffect(() => {
    if (painelRef.current) {
      painelRef.current.scrollLeft = painelRef.current.scrollWidth;
    }
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

  return (
    <div className="space-y-3" data-testid="radar-tab">
      {/* Counter header */}
      <div className="flex justify-between items-center bg-[rgba(17,17,17,0.8)] p-4 rounded-xl border border-[#333] gap-2">
        <div className="flex-1 text-center">
          <small className="text-gray-400">VERM.</small>
          <br />
          <span className="text-4xl font-black neon-red" data-testid="count-red">{red}</span>
        </div>
        <div className="flex-[2] text-center">
          <span className="brand-text text-3xl neon-green">Método L.O</span>
        </div>
        <div className="flex-1 text-center">
          <small className="text-gray-400">PRETO</small>
          <br />
          <span className="text-4xl font-black neon-black" data-testid="count-black">{black}</span>
        </div>
      </div>

      {/* Keyboard */}
      <div className="grid grid-cols-6 gap-1 bg-[rgba(17,17,17,0.9)] p-2 rounded-xl border-2 border-[#333]">
        <button
          className="roulette-btn green col-span-6"
          onClick={() => addNumber(0)}
          data-testid="btn-0"
        >
          0
        </button>
        {keyboard.map((n) => (
          <button
            key={n}
            className={`roulette-btn ${VERMELHOS.includes(n) ? "red" : "black"}`}
            onClick={() => addNumber(n)}
            data-testid={`btn-${n}`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* History card */}
      <div className="card-glass">
        {/* Cycle selector */}
        <div className="flex gap-2 mb-3">
          <button
            className={`ciclo-btn ${limiteGiros === 14 ? "active" : ""}`}
            onClick={() => setLimite(14)}
            data-testid="btn-14-giros"
          >
            14 GIROS
          </button>
          <button
            className={`ciclo-btn ${limiteGiros === 50 ? "active" : ""}`}
            onClick={() => setLimite(50)}
            data-testid="btn-50-giros"
          >
            50 GIROS
          </button>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <span className="label-accent" style={{ margin: 0 }}>HISTÓRICO</span>
          <span
            className="bg-[#222] text-[#ccff00] px-3 py-1 rounded-lg font-bold text-sm border border-[#ccff00]"
            data-testid="cycle-counter"
          >
            {giros.length} / {limiteGiros}
          </span>
        </div>

        {/* Giros panel */}
        <div
          ref={painelRef}
          className="flex gap-2 overflow-x-auto min-h-[100px] bg-[rgba(17,17,17,0.5)] border border-[#444] rounded-xl p-2"
          data-testid="giros-panel"
        >
          {giros.map((n, idx) => {
            const dozen = getDozen(n);
            const column = getColumn(n);
            const sector = getSector(n);
            const parity = getParity(n);
            const highLow = getHighLow(n);

            return (
              <div key={idx} className="flex flex-col items-center gap-1 min-w-[75px]">
                <div
                  className="mini-ball"
                  style={{ background: getBgColor(n) }}
                >
                  {n}
                </div>
                <div className="flex w-full gap-0.5">
                  <span className={`tag ${dozen.className}`}>{dozen.text}</span>
                  <span className={`tag ${column.className}`}>{column.text}</span>
                </div>
                <span className={`tag ${parity.className}`}>{parity.text}</span>
                <span className={`tag ${highLow.className}`}>{highLow.text}</span>
                <span className={`tag ${sector.className}`}>{sector.name}</span>
              </div>
            );
          })}
          {giros.length === 0 && (
            <div className="w-full text-center text-gray-500 py-8">
              Clique nos números para adicionar
            </div>
          )}
        </div>
      </div>

      {/* Regions card */}
      <div className="card-glass">
        <span className="label-accent">
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
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(regionFreqs).map(([r, count]) => {
            const isStrong = strongestRegion?.name === r && count > 0;
            return (
              <div
                key={r}
                className={`bg-[rgba(26,26,26,0.6)] p-2 rounded-lg text-center border ${isStrong ? "border-[#ccff00]" : "border-[#333]"}`}
              >
                <span className="font-bold">
                  {colorizeTitle(r).map((part, idx) => (
                    <span key={idx} className={part.color === "red" ? "txt-red" : part.color === "green" ? "txt-green" : "txt-white"}>
                      {part.text}
                    </span>
                  ))}
                </span>
                <br />
                <small className="text-[#ccff00]">{count}X</small>
              </div>
            );
          })}
        </div>

        {/* Region targets */}
        {strongestRegion && (
          <div className="mt-3 flex flex-wrap justify-center gap-2" data-testid="region-targets">
            {strongestRegion.numbers.map((num) => {
              const followsColor =
                (tendency === "V" && VERMELHOS.includes(num)) ||
                (tendency === "P" && num !== 0 && !VERMELHOS.includes(num));
              return (
                <div
                  key={num}
                  className={`mini-ball ${followsColor ? "tendencia-ativa" : ""}`}
                  style={{ background: getBgColor(num) }}
                >
                  {num}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Radar de Ocultos */}
      <div className="card-glass">
        <span className="label-accent">RADAR DE OCULTOS</span>
        <div className="grid grid-cols-3 gap-2" data-testid="terminal-weights">
          {terminalWeights.slice(0, 9).map(({ terminal, peso }) => {
            if (peso === 0) return null;
            const isSelected = terminal === alvoFinal;
            return (
              <div
                key={terminal}
                className={`soma-item p-2 text-center rounded-lg border border-[#333] ${isSelected ? "soma-selecionada" : ""}`}
                style={{ background: getBgColor(terminal) }}
                onClick={() => setTerminalSelecionado(terminal)}
                data-testid={`terminal-${terminal}`}
              >
                <span className="font-bold text-lg">{terminal}</span>
                <br />
                <small className="text-[#ccff00]">{peso}X</small>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggestion card */}
      {alvoFinal !== null && terminalFamily.length > 0 && (
        <div className="card-glass border-2 border-[#ccff00] text-center" data-testid="suggestion-card">
          <span className="text-[#ccff00] font-bold">
            FAMÍLIA: <span data-testid="family-target">{alvoFinal}</span>
          </span>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {terminalFamily.map((num) => {
              const isGold = strongestRegion?.numbers.includes(num);
              return (
                <div
                  key={num}
                  className={`mini-ball ${isGold ? "gold-confluencia" : ""}`}
                  style={{ background: getBgColor(num) }}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={undo}
          className="flex-1 py-4 bg-[#ff9800] text-white font-bold rounded-lg"
          data-testid="btn-undo"
        >
          CORRIGIR
        </button>
        <button
          onClick={limpar}
          className="flex-1 py-4 bg-[#f44336] text-white font-bold rounded-lg"
          data-testid="btn-clear"
        >
          LIMPAR
        </button>
      </div>
    </div>
  );
};

export default RadarTab;
