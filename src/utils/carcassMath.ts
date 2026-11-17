export type CutSection = 'traseiro' | 'dianteiro';
export type LaneKey = 'l1' | 'l2';

export interface LaneEntry {
  tara: string; // Peso L1 (for l1) or Peso L2 (for l2)
  pesoTotal: string;
}

export interface CarcassRow {
  id: string;
  l1: LaneEntry;
  l2: LaneEntry;
}

export interface ConferenceSheet {
  id: string;
  data: string; // YYYY-MM-DD
  pesoNF: string;
  traseiro: CarcassRow[];
  dianteiro: CarcassRow[];
  updatedAt: string;
}

export interface SheetSummary {
  traseiroTotal: number;
  dianteiroTotal: number;
  conferenciaTotal: number;
  pesoNF: number;
  diferencaNF: number;
  traseiroCount: number;
  dianteiroCount: number;
}

export const DEFAULT_ROW_COUNT = 8;

/**
 * Parses a localized numeric string (accepting both "." and "," as decimal separator).
 * Returns null when blank or invalid.
 */
export function parseDecimalInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Allow Brazilian comma decimals like "145,50" or dot decimals like "145.50"
  let normalized = trimmed.replace(/\s+/g, '');
  if (normalized.includes(',') && normalized.includes('.')) {
    // Assume "." is thousands separator when "," is also present (e.g. "1.250,50")
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(',', '.');
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

/**
 * Sanitizes raw user typing so only valid decimal characters remain.
 */
export function sanitizeDecimalInput(raw: string): string {
  // Replace comma with dot or preserve comma? Keep digits, single comma/dot, optional leading minus
  const cleaned = raw.replace(/[^\d.,]/g, '');
  const parts = cleaned.split(/[.,]/);
  if (parts.length <= 1) return cleaned;
  const separator = cleaned.includes(',') ? ',' : '.';
  return `${parts[0]}${separator}${parts.slice(1).join('')}`;
}

/**
 * Calculates Peso Líquido = Peso Total - Peso L1 (or Peso L2).
 * When Peso Total is blank, returns 0 so intermediate entry of Peso L1/L2
 * does not produce misleading negative totals.
 */
export function calculateNetWeight(entry: LaneEntry): number {
  const total = parseDecimalInput(entry.pesoTotal);
  if (total === null) return 0;

  const deduction = parseDecimalInput(entry.tara) ?? 0;
  const result = total - deduction;
  // Round to 3 decimal places to avoid IEEE-754 floating point artifacts
  return Math.round(result * 1000) / 1000;
}

/**
 * Sums all Peso Líquido values across L1 and L2 for a section (Traseiro or Dianteiro).
 */
export function sumSectionNetWeight(rows: CarcassRow[]): number {
  const sum = rows.reduce((acc, row) => {
    return acc + calculateNetWeight(row.l1) + calculateNetWeight(row.l2);
  }, 0);
  return Math.round(sum * 1000) / 1000;
}

/**
 * Counts how many lane entries in a section have a Peso Total entered.
 */
export function countFilledEntries(rows: CarcassRow[]): number {
  return rows.reduce((acc, row) => {
    const hasL1 = parseDecimalInput(row.l1.pesoTotal) !== null ? 1 : 0;
    const hasL2 = parseDecimalInput(row.l2.pesoTotal) !== null ? 1 : 0;
    return acc + hasL1 + hasL2;
  }, 0);
}

/**
 * Computes all summary totals for the top header block.
 */
export function calculateSheetSummary(sheet: ConferenceSheet): SheetSummary {
  const traseiroTotal = sumSectionNetWeight(sheet.traseiro);
  const dianteiroTotal = sumSectionNetWeight(sheet.dianteiro);
  const conferenciaTotal = Math.round((traseiroTotal + dianteiroTotal) * 1000) / 1000;
  const pesoNF = parseDecimalInput(sheet.pesoNF) ?? 0;
  const diferencaNF = Math.round((conferenciaTotal - pesoNF) * 1000) / 1000;

  return {
    traseiroTotal,
    dianteiroTotal,
    conferenciaTotal,
    pesoNF,
    diferencaNF,
    traseiroCount: countFilledEntries(sheet.traseiro),
    dianteiroCount: countFilledEntries(sheet.dianteiro),
  };
}

/**
 * Formats a numeric weight in Brazilian Portuguese style (e.g. "0", "145,50").
 * Uses compact integer formatting when fractional part is zero, or 2 decimals otherwise.
 */
export function formatWeight(value: number, alwaysShowDecimals = false): string {
  const rounded = Math.round(value * 100) / 100;
  const isInteger = Math.abs(rounded - Math.round(rounded)) < 1e-6;
  return rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: alwaysShowDecimals || !isInteger ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export function createEmptyRow(prefix: string, index: number): CarcassRow {
  return {
    id: `${prefix}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    l1: { tara: '', pesoTotal: '' },
    l2: { tara: '', pesoTotal: '' },
  };
}

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptySheet(dateISO: string = getTodayISO()): ConferenceSheet {
  return {
    id: `conf-${Date.now().toString(36)}`,
    data: dateISO,
    pesoNF: '',
    traseiro: Array.from({ length: DEFAULT_ROW_COUNT }, (_, i) => createEmptyRow('traseiro', i + 1)),
    dianteiro: Array.from({ length: DEFAULT_ROW_COUNT }, (_, i) => createEmptyRow('dianteiro', i + 1)),
    updatedAt: new Date().toISOString(),
  };
}

export function buildCsvReport(sheet: ConferenceSheet): string {
  const summary = calculateSheetSummary(sheet);
  const lines: string[] = [];
  lines.push('CONFERENCIA DO RECEBIMENTO DE CARCACAS');
  lines.push(`Data;${sheet.data || '-'};Peso NF;${formatWeight(summary.pesoNF, true)}`);
  lines.push(`Traseiro;${formatWeight(summary.traseiroTotal, true)};Dianteiro;${formatWeight(summary.dianteiroTotal, true)}`);
  lines.push(`Total Conferencia;${formatWeight(summary.conferenciaTotal, true)};Diferenca NF/Conferencia;${formatWeight(summary.diferencaNF, true)}`);
  lines.push('');

  const pushSection = (label: string, rows: CarcassRow[]) => {
    lines.push(label);
    lines.push('Linha;L1 Peso L1;L1 Peso Total;L1 Peso Liquido;L2 Peso L2;L2 Peso Total;L2 Peso Liquido');
    rows.forEach((row, idx) => {
      const l1Net = calculateNetWeight(row.l1);
      const l2Net = calculateNetWeight(row.l2);
      lines.push(
        `${idx + 1};${row.l1.tara || '0'};${row.l1.pesoTotal || '0'};${formatWeight(l1Net, true)};${row.l2.tara || '0'};${row.l2.pesoTotal || '0'};${formatWeight(l2Net, true)}`
      );
    });
    lines.push('');
  };

  pushSection('TRASEIRO', sheet.traseiro);
  pushSection('DIANTEIRO', sheet.dianteiro);

  return lines.join('\n');
}
