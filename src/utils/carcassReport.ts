import {
  ConferenceSheet,
  SheetSummary,
  calculateNetWeight,
  calculateSheetSummary,
  formatWeight,
  parseDecimalInput,
} from './carcassMath';

export type ReportPreset = 'today' | 'last7' | 'month' | 'last30' | 'custom';
export type ReportCutScope = 'both' | 'traseiro' | 'dianteiro';
export type PowerBiGranularity = 'consolidated' | 'detailed';
export type TabularCsvDialect = 'standard' | 'ptbr';

export interface ReportFilter {
  startDate: string; // YYYY-MM-DD (inclusive)
  endDate: string; // YYYY-MM-DD (inclusive)
  cutScope: ReportCutScope;
  includeDraft: boolean;
}

export interface ReportSheetRow {
  sheet: ConferenceSheet;
  summary: SheetSummary;
  isDraft: boolean;
}

export interface PeriodReportResult {
  rows: ReportSheetRow[];
  totalTraseiro: number;
  totalDianteiro: number;
  totalGeral: number;
  totalPesoNF: number;
  diferencaNF: number;
  totalTraseiroCount: number;
  totalDianteiroCount: number;
  conferenceCount: number;
}

export function addDaysISO(baseISO: string, deltaDays: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPresetRange(
  preset: Exclude<ReportPreset, 'custom'>,
  referenceISO: string
): { startDate: string; endDate: string } {
  switch (preset) {
    case 'today':
      return { startDate: referenceISO, endDate: referenceISO };
    case 'last7':
      return { startDate: addDaysISO(referenceISO, -6), endDate: referenceISO };
    case 'last30':
      return { startDate: addDaysISO(referenceISO, -29), endDate: referenceISO };
    case 'month': {
      const [year, month] = referenceISO.split('-');
      return { startDate: `${year}-${month}-01`, endDate: referenceISO };
    }
  }
}

export function isDateInRange(
  dateISO: string,
  startDate: string,
  endDate: string
): boolean {
  if (!dateISO) return false;
  if (startDate && dateISO < startDate) return false;
  if (endDate && dateISO > endDate) return false;
  return true;
}

export function buildPeriodReport(
  history: ConferenceSheet[],
  draft: ConferenceSheet | null,
  filter: ReportFilter
): PeriodReportResult {
  const combined: Array<{ sheet: ConferenceSheet; isDraft: boolean }> = history.map(
    (s) => ({ sheet: s, isDraft: false })
  );

  if (filter.includeDraft && draft) {
    combined.unshift({ sheet: draft, isDraft: true });
  }

  const matching = combined
    .filter(({ sheet }) =>
      isDateInRange(sheet.data, filter.startDate, filter.endDate)
    )
    .sort((a, b) => {
      if (a.sheet.data !== b.sheet.data) {
        return b.sheet.data.localeCompare(a.sheet.data);
      }
      return b.sheet.updatedAt.localeCompare(a.sheet.updatedAt);
    });

  const rows: ReportSheetRow[] = matching.map(({ sheet, isDraft }) => ({
    sheet,
    summary: calculateSheetSummary(sheet),
    isDraft,
  }));

  let totalTraseiro = 0;
  let totalDianteiro = 0;
  let totalPesoNF = 0;
  let totalTraseiroCount = 0;
  let totalDianteiroCount = 0;

  for (const row of rows) {
    totalTraseiro += row.summary.traseiroTotal;
    totalDianteiro += row.summary.dianteiroTotal;
    totalPesoNF += row.summary.pesoNF;
    totalTraseiroCount += row.summary.traseiroCount;
    totalDianteiroCount += row.summary.dianteiroCount;
  }

  totalTraseiro = Math.round(totalTraseiro * 1000) / 1000;
  totalDianteiro = Math.round(totalDianteiro * 1000) / 1000;
  totalPesoNF = Math.round(totalPesoNF * 1000) / 1000;

  const visibleTraseiro = filter.cutScope === 'dianteiro' ? 0 : totalTraseiro;
  const visibleDianteiro = filter.cutScope === 'traseiro' ? 0 : totalDianteiro;
  const totalGeral = Math.round((visibleTraseiro + visibleDianteiro) * 1000) / 1000;
  const diferencaNF = Math.round((totalGeral - totalPesoNF) * 1000) / 1000;

  return {
    rows,
    totalTraseiro,
    totalDianteiro,
    totalGeral,
    totalPesoNF,
    diferencaNF,
    totalTraseiroCount,
    totalDianteiroCount,
    conferenceCount: rows.length,
  };
}

export function formatDateBR(dateISO: string): string {
  if (!dateISO) return 'Sem data';
  const parts = dateISO.split('-');
  if (parts.length !== 3) return dateISO;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function buildPeriodReportCsv(
  report: PeriodReportResult,
  title: string,
  filter: ReportFilter,
  showNfComparison: boolean
): string {
  const lines: string[] = [];
  lines.push(title || 'RELATORIO DE CONFERENCIA DE CARCACAS');
  lines.push(
    `Periodo;${formatDateBR(filter.startDate)} a ${formatDateBR(filter.endDate)};Conferencias;${report.conferenceCount}`
  );

  if (filter.cutScope !== 'dianteiro') {
    lines.push(
      `Peso Liquido Total Traseiro;${formatWeight(report.totalTraseiro, true)} kg;Lancamentos Traseiro;${report.totalTraseiroCount}`
    );
  }
  if (filter.cutScope !== 'traseiro') {
    lines.push(
      `Peso Liquido Total Dianteiro;${formatWeight(report.totalDianteiro, true)} kg;Lancamentos Dianteiro;${report.totalDianteiroCount}`
    );
  }
  lines.push(`Total Geral Selecionado;${formatWeight(report.totalGeral, true)} kg`);
  if (showNfComparison) {
    lines.push(
      `Peso NF Acumulado;${formatWeight(report.totalPesoNF, true)} kg;Diferenca NF/Conferencia;${formatWeight(report.diferencaNF, true)} kg`
    );
  }

  lines.push('');
  lines.push('Data;Origem;Peso NF (kg);Traseiro Liquido (kg);Dianteiro Liquido (kg);Total Conferido (kg);Diferenca NF (kg)');
  for (const item of report.rows) {
    lines.push(
      `${formatDateBR(item.sheet.data)};${item.isDraft ? 'Rascunho atual' : 'Salva'};${formatWeight(item.summary.pesoNF, true)};${formatWeight(item.summary.traseiroTotal, true)};${formatWeight(item.summary.dianteiroTotal, true)};${formatWeight(item.summary.conferenciaTotal, true)};${formatWeight(item.summary.diferencaNF, true)}`
    );
  }

  return lines.join('\n');
}

function escapeCsvCell(value: string, delimiter: string): string {
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatTabularNumber(value: number, dialect: TabularCsvDialect): string {
  const rounded = Math.round(value * 1000) / 1000;
  const fixed = rounded.toFixed(2);
  return dialect === 'ptbr' ? fixed.replace('.', ',') : fixed;
}

/**
 * Generates a flat, tidy tabular CSV (1 header row, no summary/blank lines)
 * ready for direct Power BI / Power Query ingestion.
 */
export function buildPowerBiTabularCsv(
  report: PeriodReportResult,
  filter: ReportFilter,
  granularity: PowerBiGranularity,
  dialect: TabularCsvDialect = 'standard'
): string {
  const delimiter = dialect === 'ptbr' ? ';' : ',';
  const lines: string[] = [];

  const pushRow = (cells: Array<string | number>) => {
    lines.push(
      cells.map((cell) => escapeCsvCell(String(cell), delimiter)).join(delimiter)
    );
  };

  if (granularity === 'consolidated') {
    pushRow([
      'IdConferencia',
      'Data',
      'Origem',
      'PesoNF',
      'TraseiroLiquido',
      'DianteiroLiquido',
      'TotalConferido',
      'DiferencaNF',
      'LancamentosTraseiro',
      'LancamentosDianteiro',
    ]);

    for (const item of report.rows) {
      const traseiro =
        filter.cutScope === 'dianteiro' ? 0 : item.summary.traseiroTotal;
      const dianteiro =
        filter.cutScope === 'traseiro' ? 0 : item.summary.dianteiroTotal;
      const total = Math.round((traseiro + dianteiro) * 1000) / 1000;
      const diff = Math.round((total - item.summary.pesoNF) * 1000) / 1000;

      pushRow([
        item.sheet.id,
        item.sheet.data,
        item.isDraft ? 'Rascunho' : 'Salva',
        formatTabularNumber(item.summary.pesoNF, dialect),
        formatTabularNumber(traseiro, dialect),
        formatTabularNumber(dianteiro, dialect),
        formatTabularNumber(total, dialect),
        formatTabularNumber(diff, dialect),
        filter.cutScope === 'dianteiro' ? 0 : item.summary.traseiroCount,
        filter.cutScope === 'traseiro' ? 0 : item.summary.dianteiroCount,
      ]);
    }

    return lines.join('\n');
  }

  // Detailed granularity: 1 flat row per weighed lane entry (L1 / L2)
  pushRow([
    'IdConferencia',
    'Data',
    'Origem',
    'Corte',
    'Linha',
    'Grupo',
    'PesoTara',
    'PesoTotal',
    'PesoLiquido',
  ]);

  for (const item of report.rows) {
    const origem = item.isDraft ? 'Rascunho' : 'Salva';
    const sections: Array<{
      label: 'Traseiro' | 'Dianteiro';
      rows: typeof item.sheet.traseiro;
    }> = [];

    if (filter.cutScope !== 'dianteiro') {
      sections.push({ label: 'Traseiro', rows: item.sheet.traseiro });
    }
    if (filter.cutScope !== 'traseiro') {
      sections.push({ label: 'Dianteiro', rows: item.sheet.dianteiro });
    }

    for (const sec of sections) {
      sec.rows.forEach((carcassRow, idx) => {
        const lanes: Array<{
          group: 'L1' | 'L2';
          entry: typeof carcassRow.l1;
        }> = [
          { group: 'L1', entry: carcassRow.l1 },
          { group: 'L2', entry: carcassRow.l2 },
        ];

        for (const lane of lanes) {
          const taraNum = parseDecimalInput(lane.entry.tara);
          const totalNum = parseDecimalInput(lane.entry.pesoTotal);
          if (taraNum === null && totalNum === null) continue;

          const net = calculateNetWeight(lane.entry);
          pushRow([
            item.sheet.id,
            item.sheet.data,
            origem,
            sec.label,
            idx + 1,
            lane.group,
            formatTabularNumber(taraNum ?? 0, dialect),
            formatTabularNumber(totalNum ?? 0, dialect),
            formatTabularNumber(net, dialect),
          ]);
        }
      });
    }
  }

  return lines.join('\n');
}
