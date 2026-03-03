# Estratégias do HTML Original - Documentação de Referência

Este documento contém a lógica completa das estratégias implementadas no sistema RADAR V22 + Método L.O.

## Números Vermelhos na Roleta

```javascript
const VERMELHOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
```

## Setores da Roleta

### Zero Region
```javascript
const ZERO_REG = [0, 32, 15, 12, 26, 3, 35];
```

### Voisins du Zero
```javascript
const VOISINS = [22, 18, 29, 7, 28, 19, 4, 21, 2, 25];
```

### Tier du Cylindre
```javascript
const TIER = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];
```

### Orphelins
```javascript
const ORPH = [1, 20, 14, 31, 9, 6, 34, 17];
```

## Regiões Mapeadas

```javascript
const REGIOES_MAPEADAS = {
  "2/3": [2, 11, 20, 14, 21, 25, 30, 36],
  "6/5": [6, 15, 24, 33, 16, 27, 32],
  "7/6": [7, 18, 25, 34, 6, 17, 28, 29, 27],
  "8/3": [8, 26, 35, 0, 3, 12, 30, 17, 25, 28],
  "9/4": [9, 18, 27, 36, 13, 31, 22, 29, 19, 4],
  "5": [5, 10, 23, 14, 16, 27, 32]
};
```

## Pesos Master (Radar de Ocultos)

Cada número sorteado contribui para diferentes terminais com pesos específicos:

```javascript
const PESOS_MASTER = {
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
```

## Algoritmo de Cálculo da Família de Terminais

Para encontrar todos os números que pertencem à família de um terminal:

```javascript
function getTerminalFamily(terminal) {
  const numbers = [];
  for (let i = 0; i <= 36; i++) {
    const d1 = Math.floor(i / 10);  // dezena
    const d2 = i % 10;              // unidade

    if (i < 10) {
      // Para números de 0-9, o próprio número é o terminal
      if (i === terminal) numbers.push(i);
    } else {
      // Para números 10-36:
      // Soma dos dígitos = terminal OU
      // Diferença absoluta dos dígitos = terminal
      if (d1 + d2 === terminal || Math.abs(d1 - d2) === terminal) {
        numbers.push(i);
      }
    }
  }
  return numbers;
}

// Exemplos:
// Terminal 7: [7, 16, 25, 34] (16=1+6=7, 25=2+5=7, 34=3+4=7)
// Terminal 0: [0, 11, 22, 33] (11=1-1=0, 22=2-2=0, 33=3-3=0)
// Terminal 9: [9, 18, 27, 36] (18=1+8=9, 27=2+7=9, 36=3+6=9)
```

## Algoritmo de Tendência de Cor

```javascript
function getTendency(red, black) {
  if (red === black) return null;  // Equilibrado
  return red > black ? "V" : "P";  // V = Vermelho, P = Preto
}
```

## Classificações de Números

### Dúzias
- D1 (1ª dúzia): 1-12
- D2 (2ª dúzia): 13-24
- D3 (3ª dúzia): 25-36
- Zero não pertence a nenhuma dúzia

### Colunas
- C1 (1ª coluna): 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
- C2 (2ª coluna): 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
- C3 (3ª coluna): 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36

```javascript
function getColumn(n) {
  if (n === 0) return null;
  const r = n % 3;
  if (r === 1) return "C1";
  if (r === 2) return "C2";
  return "C3"; // r === 0
}
```

### Paridade
- PAR: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36
- ÍMPAR: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35

### Alto/Baixo
- BAIXO: 1-18
- ALTO: 19-36

## Regras de Confluência

Um número tem "confluência dourada" quando:
1. Pertence à família do terminal mais frequente
2. E também pertence à região mais frequente

Esses números são destacados com borda dourada na interface.

## Ciclos de Análise

O sistema suporta dois modos de ciclo:
- **14 giros**: Análise mais curta, tendências recentes
- **50 giros**: Análise mais longa, tendências de médio prazo

## Gestão de Banca

### Fórmulas

```javascript
// Meta do dia
valorMeta = bancaAtual * (metaPercent / 100);

// Stop do dia
valorStop = bancaAtual * (stopPercent / 100);

// Nova banca após ganho
novaBanca = bancaAtual + valorGanho;

// Nova banca após perda
novaBanca = bancaAtual - valorPerdido;
```

### Projeção de 30 Dias

A tabela de projeção mostra:
- Dia
- Banca inicial do dia
- Valor da meta (+)
- Valor do stop (-)
- Banca final projetada (assumindo meta cumprida)

---

## Arquivo de Referência

Todo o código fonte das estratégias está em:
`frontend/src/engine/radarEngine.js`

Este arquivo contém:
- Todas as constantes (números, setores, regiões)
- Pesos master completos
- Funções de cálculo
- Não deve ser modificado sem autorização explícita
