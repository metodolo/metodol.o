/**
 * Radar Engine - Core logic for RADAR V22 / Método L.O
 * This file contains all the strategy rules from the original HTML
 * DO NOT MODIFY these rules without explicit authorization
 */

// Red numbers on roulette
export const VERMELHOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Sectors
export const ZERO_REG = [0, 32, 15, 12, 26, 3, 35];
export const VOISINS = [22, 18, 29, 7, 28, 19, 4, 21, 2, 25];
export const TIER = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];
export const ORPH = [1, 20, 14, 31, 9, 6, 34, 17];

// Region mappings
export const REGIOES_MAPEADAS = {
  "2/3": [2, 11, 20, 14, 21, 25, 30, 36],
  "6/5": [6, 15, 24, 33, 16, 27, 32],
  "7/6": [7, 18, 25, 34, 6, 17, 28, 29, 27],
  "8/3": [8, 26, 35, 0, 3, 12, 30, 17, 25, 28],
  "9/4": [9, 18, 27, 36, 13, 31, 22, 29, 19, 4],
  "5": [5, 10, 23, 14, 16, 27, 32]
};

// Master weights for terminal analysis
export const PESOS_MASTER = {
  1: { 1: 1, 6: 1, 4: 1, 2: 2, 5: 1, 7: 1, 3: 1, 8: 1, 9: 1 },
  2: { 2: 1, 7: 2, 3: 2, 9: 1, 1: 1, 5: 1, 4: 1, 6: 1, 8: 1 },
  3: { 3: 2, 8: 3, 4: 1, 2: 1 },
  4: { 4: 1, 3: 1, 1: 2, 7: 1, 8: 1, 0: 1 },
  5: { 5: 1, 6: 1, 0: 1, 8: 1, 2: 1 },
  6: { 6: 1, 9: 1, 7: 2, 1: 1, 5: 2, 3: 1 },
  7: { 7: 2, 4: 1, 2: 1, 6: 1, 0: 1 },
  8: { 8: 1, 5: 2, 3: 1, 1: 1, 0: 1 },
  9: { 9: 1, 5: 1, 4: 2, 8: 1, 6: 1, 7: 1, 3: 1, 2: 1 },
  10: { 1: 2, 5: 2, 0: 1, 4: 1 },
  11: { 2: 1, 3: 2, 9: 1, 5: 1, 7: 1 },
  12: { 3: 1, 1: 1, 8: 1, 2: 1, 6: 1, 0: 1 },
  13: { 2: 1, 7: 1, 3: 1, 9: 2, 5: 1, 4: 1, 6: 1, 8: 1, 1: 1 },
  14: { 5: 1, 3: 2, 7: 1, 2: 2, 4: 2, 6: 1, 8: 1 },
  15: { 5: 2, 4: 1, 8: 1, 0: 1, 1: 2, 6: 1, 7: 1, 3: 2 },
  16: { 7: 1, 5: 1, 6: 2, 2: 2, 8: 1, 4: 1 },
  17: { 8: 1, 6: 1, 7: 3, 1: 1, 3: 2, 9: 1, 5: 1 },
  18: { 8: 1, 7: 2, 4: 1, 2: 2, 5: 1, 3: 1, 6: 1 },
  19: { 0: 2, 4: 2, 6: 2, 5: 1 },
  20: { 2: 1, 1: 1, 5: 2, 7: 1, 3: 1, 9: 1, 4: 1, 6: 1, 8: 1 },
  21: { 3: 2, 2: 2, 4: 1, 7: 1, 8: 1, 6: 1, 5: 1, 9: 1 },
  22: { 4: 1, 9: 2, 7: 3, 3: 1 },
  23: { 5: 1, 0: 1, 8: 2, 2: 2, 6: 1, 4: 1, 3: 1, 7: 1, 9: 1 },
  24: { 6: 2, 2: 1, 5: 4, 7: 2, 3: 3, 8: 1, 9: 1, 4: 1 },
  25: { 7: 1, 3: 2, 8: 2, 6: 1, 4: 2, 2: 1 },
  26: { 8: 1, 4: 1, 0: 1, 7: 1, 5: 1, 3: 1 },
  27: { 9: 1, 5: 2, 4: 1, 2: 2, 6: 2, 7: 1, 3: 1, 8: 1 },
  28: { 6: 1, 0: 2, 7: 2, 3: 2, 1: 1, 8: 1, 5: 1 },
  29: { 2: 1, 7: 3, 9: 2, 3: 2, 1: 1, 4: 1, 6: 1, 8: 1, 5: 1 },
  30: { 3: 1, 2: 2, 8: 1, 6: 1 },
  31: { 4: 2, 9: 2, 5: 2, 3: 2, 7: 3, 2: 1, 1: 1, 6: 1, 8: 1 },
  32: { 5: 2, 1: 1, 0: 1, 6: 2, 4: 2, 8: 2, 2: 2, 3: 1, 7: 1, 9: 1 },
  33: { 3: 2, 7: 2, 5: 2, 1: 1, 9: 1, 6: 1 },
  34: { 7: 1, 1: 1, 6: 3, 8: 2, 4: 2, 2: 2, 5: 1, 3: 1, 9: 1 },
  35: { 8: 2, 3: 3, 1: 2, 2: 2, 5: 3, 4: 1, 6: 1, 7: 1, 9: 1 },
  36: { 9: 1, 3: 2, 2: 2, 4: 1, 6: 2, 8: 1, 5: 1, 7: 1 }
};

/**
 * Check if a number is red
 */
export const isRed = (n) => VERMELHOS.includes(n);

/**
 * Check if a number is black
 */
export const isBlack = (n) => n !== 0 && !VERMELHOS.includes(n);

/**
 * Get dozen info (D1, D2, D3, or Z for zero)
 */
export const getDozen = (n) => {
  if (n === 0) return { text: "Z", className: "" };
  if (n <= 12) return { text: "D1", className: "d1" };
  if (n <= 24) return { text: "D2", className: "d2" };
  return { text: "D3", className: "d3" };
};

/**
 * Get column info (C1, C2, C3, or Z for zero)
 */
export const getColumn = (n) => {
  if (n === 0) return { text: "Z", className: "" };
  const r = n % 3;
  if (r === 1) return { text: "C1", className: "c1" };
  if (r === 2) return { text: "C2", className: "c2" };
  return { text: "C3", className: "c3" };
};

/**
 * Get sector info
 */
export const getSector = (n) => {
  if (ZERO_REG.includes(n)) return { name: "ZERO", className: "setor-zero" };
  if (VOISINS.includes(n)) return { name: "VOI", className: "setor-voisins" };
  if (TIER.includes(n)) return { name: "TIER", className: "setor-tier" };
  if (ORPH.includes(n)) return { name: "ORP", className: "setor-orph" };
  return { name: "?", className: "" };
};

/**
 * Get parity info
 */
export const getParity = (n) => {
  if (n === 0) return { text: "ZERO", className: "" };
  return n % 2 === 0
    ? { text: "PAR", className: "tag-par" }
    : { text: "IMP", className: "tag-impar" };
};

/**
 * Get high/low info
 */
export const getHighLow = (n) => {
  if (n === 0) return { text: "ZERO", className: "" };
  return n >= 19
    ? { text: "ALTO", className: "tag-alto" }
    : { text: "BAIXO", className: "tag-baixo" };
};

/**
 * Get color class for a number
 */
export const getColorClass = (n) => {
  if (n === 0) return "green";
  return isRed(n) ? "red" : "black";
};

/**
 * Get background color for a number
 */
export const getBgColor = (n) => {
  if (n === 0) return "#00ff41";
  return isRed(n) ? "#ff3131" : "#2b2b2b";
};

/**
 * Calculate terminal weights from giros
 */
export const calculateTerminalWeights = (giros) => {
  const placarPesos = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

  giros.forEach((n) => {
    if (PESOS_MASTER[n]) {
      for (const term in PESOS_MASTER[n]) {
        placarPesos[term] += PESOS_MASTER[n][term];
      }
    }
  });

  return Object.entries(placarPesos)
    .sort((a, b) => b[1] - a[1])
    .map(([num, peso]) => ({ terminal: parseInt(num), peso }));
};

/**
 * Calculate region frequencies
 */
export const calculateRegionFrequencies = (giros) => {
  const freqs = {};
  Object.keys(REGIOES_MAPEADAS).forEach((r) => {
    freqs[r] = 0;
  });

  giros.forEach((n) => {
    for (const r in REGIOES_MAPEADAS) {
      if (REGIOES_MAPEADAS[r].includes(n)) {
        freqs[r]++;
      }
    }
  });

  return freqs;
};

/**
 * Get strongest regions (can be multiple if they have same max count)
 */
export const getStrongestRegion = (freqs) => {
  const maxVal = Math.max(...Object.values(freqs));
  if (maxVal === 0) return null;

  // Return first region for backwards compatibility
  for (const r in freqs) {
    if (freqs[r] === maxVal) {
      return { name: r, count: maxVal, numbers: REGIOES_MAPEADAS[r] };
    }
  }
  return null;
};

/**
 * Get ALL strongest regions (returns array)
 */
export const getAllStrongestRegions = (freqs) => {
  const maxVal = Math.max(...Object.values(freqs));
  if (maxVal === 0) return [];

  const strongest = [];
  for (const r in freqs) {
    if (freqs[r] === maxVal) {
      strongest.push({ name: r, count: maxVal, numbers: REGIOES_MAPEADAS[r] });
    }
  }
  return strongest;
};

/**
 * Check if a region is one of the strongest
 */
export const isStrongestRegion = (freqs, regionName) => {
  const maxVal = Math.max(...Object.values(freqs));
  if (maxVal === 0) return false;
  return freqs[regionName] === maxVal;
};

/**
 * Count red and black
 */
export const countColors = (giros) => {
  let red = 0;
  let black = 0;

  giros.forEach((n) => {
    if (n !== 0) {
      if (isRed(n)) red++;
      else black++;
    }
  });

  return { red, black };
};

/**
 * Get tendency (V = red, P = black, null = equal)
 */
export const getTendency = (red, black) => {
  if (red === black) return null;
  return red > black ? "V" : "P";
};

/**
 * Get all numbers for a terminal family
 */
export const getTerminalFamily = (terminal) => {
  const numbers = [];
  for (let i = 0; i <= 36; i++) {
    const d1 = Math.floor(i / 10);
    const d2 = i % 10;

    if (i < 10) {
      if (i === terminal) numbers.push(i);
    } else {
      // Sum or difference of digits equals terminal
      if (d1 + d2 === terminal || Math.abs(d1 - d2) === terminal) {
        numbers.push(i);
      }
    }
  }
  return numbers;
};

/**
 * Colorize region title (for display)
 */
export const colorizeTitle = (str) => {
  return str.split(/(\/)/).map((parte, idx) => {
    if (parte === "/") return { text: "/", color: "white" };
    const num = parseInt(parte);
    if (isNaN(num)) return { text: parte, color: "white" };
    let color = "white";
    if (num === 0) color = "green";
    else if (isRed(num)) color = "red";
    return { text: parte, color };
  });
};
