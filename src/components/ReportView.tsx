import React, { useMemo, useState } from 'react';
import {
  CalendarRange,
  Check,
  Download,
  FileBarChart2,
  Printer,
  Table2,
} from 'lucide-react';
import {
  ConferenceSheet,
  formatWeight,
  getTodayISO,
} from '../utils/carcassMath';
import {
  PowerBiGranularity,
  ReportCutScope,
  ReportPreset,
  TabularCsvDialect,
  buildPeriodReport,
  buildPeriodReportCsv,
  buildPowerBiTabularCsv,
  formatDateBR,
  getPresetRange,
} from '../utils/carcassReport';
import { BrandEmblem } from './BrandEmblem';

interface ReportViewProps {
  history: ConferenceSheet[];
  draft: ConferenceSheet;
  hasUnsavedDraft: boolean;
  onGoToWorksheet: () => void;
  onLoadSheet: (sheet: ConferenceSheet) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  history,
  draft,
  hasUnsavedDraft,
  onGoToWorksheet,
  onLoadSheet,
}) => {
  const todayISO = useMemo(() => getTodayISO(), []);
  const initialRange = useMemo(() => getPresetRange('month', todayISO), [todayISO]);

  const [preset, setPreset] = useState<ReportPreset>('month');
  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);
  const [cutScope, setCutScope] = useState<ReportCutScope>('both');
  const [includeDraft, setIncludeDraft] = useState<boolean>(hasUnsavedDraft);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(true);
  const [showNfComparison, setShowNfComparison] = useState<boolean>(true);
  const [customTitle, setCustomTitle] = useState<string>(
    'Relatório de Peso Líquido — Recebimento de Carcaças'
  );
  const [pbiGranularity, setPbiGranularity] =
    useState<PowerBiGranularity>('detailed');
  const [pbiDialect, setPbiDialect] = useState<TabularCsvDialect>('standard');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const handleSelectPreset = (nextPreset: Exclude<ReportPreset, 'custom'>) => {
    const range = getPresetRange(nextPreset, todayISO);
    setPreset(nextPreset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const report = useMemo(
    () =>
      buildPeriodReport(history, hasUnsavedDraft ? draft : null, {
        startDate,
        endDate,
        cutScope,
        includeDraft: includeDraft && hasUnsavedDraft,
      }),
    [history, draft, hasUnsavedDraft, startDate, endDate, cutScope, includeDraft]
  );

  const showTraseiro = cutScope === 'both' || cutScope === 'traseiro';
  const showDianteiro = cutScope === 'both' || cutScope === 'dianteiro';

  const combinedForShare =
    (showTraseiro ? report.totalTraseiro : 0) +
    (showDianteiro ? report.totalDianteiro : 0);
  const traseiroPercent =
    combinedForShare > 0 && showTraseiro
      ? Math.round((report.totalTraseiro / combinedForShare) * 1000) / 10
      : 0;
  const dianteiroPercent =
    combinedForShare > 0 && showDianteiro
      ? Math.round((report.totalDianteiro / combinedForShare) * 1000) / 10
      : 0;

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([`\uFEFF${content}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportReportCsv = () => {
    const csv = buildPeriodReportCsv(
      report,
      customTitle,
      {
        startDate,
        endDate,
        cutScope,
        includeDraft: includeDraft && hasUnsavedDraft,
      },
      showNfComparison
    );
    triggerDownload(
      csv,
      `relatorio-carcacas-${startDate || 'inicio'}-a-${endDate || 'fim'}.csv`
    );
    setExportFeedback('Relatório CSV exportado.');
  };

  const handleExportPowerBi = () => {
    const csv = buildPowerBiTabularCsv(
      report,
      {
        startDate,
        endDate,
        cutScope,
        includeDraft: includeDraft && hasUnsavedDraft,
      },
      pbiGranularity,
      pbiDialect
    );
    const suffix = pbiGranularity === 'detailed' ? 'lancamentos' : 'consolidado';
    triggerDownload(
      csv,
      `powerbi-carcacas-${suffix}-${startDate || 'inicio'}-a-${endDate || 'fim'}.csv`
    );
    setExportFeedback(
      `Arquivo tabular (${pbiGranularity === 'detailed' ? 'por lançamento' : 'consolidado'}) exportado para Power BI.`
    );
  };

  return (
    <div className="space-y-5">
      {/* Configuration / Customization Panel */}
      <section
        aria-labelledby="report-config-heading"
        className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden no-print"
      >
        <div className="px-4 py-3.5 sm:px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CalendarRange className="w-5 h-5 text-[#1B5E42] shrink-0" />
            <div className="min-w-0">
              <h2
                id="report-config-heading"
                className="text-sm sm:text-base font-bold text-slate-900"
              >
                Personalizar Relatório por Período
              </h2>
              <p className="text-xs text-slate-500">
                Defina o prazo estipulado e escolha os cortes e detalhamentos exibidos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={report.conferenceCount === 0}
              onClick={handleExportReportCsv}
              className="min-h-[44px] sm:min-h-[40px] px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] sm:min-h-[40px] px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-[#1B5E42] hover:bg-[#144732] rounded-lg transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Period Presets */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">
              Prazo Rápido
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'today', label: 'Hoje' },
                  { id: 'last7', label: 'Últimos 7 dias' },
                  { id: 'month', label: 'Este mês' },
                  { id: 'last30', label: 'Últimos 30 dias' },
                ] as const
              ).map((item) => {
                const active = preset === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPreset(item.id)}
                    className={`min-h-[44px] sm:min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#1B5E42] text-white border-[#1B5E42]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range + Cut Scope + Custom Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Data Inicial
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setPreset('custom');
                  setStartDate(e.target.value);
                }}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1B5E42] focus:ring-2 focus:ring-[#1B5E42]/20"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Data Final
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setPreset('custom');
                  setEndDate(e.target.value);
                }}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1B5E42] focus:ring-2 focus:ring-[#1B5E42]/20"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cortes no Relatório
              </span>
              <select
                value={cutScope}
                onChange={(e) => setCutScope(e.target.value as ReportCutScope)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1B5E42] focus:ring-2 focus:ring-[#1B5E42]/20"
              >
                <option value="both">Traseiro e Dianteiro</option>
                <option value="traseiro">Somente Traseiro</option>
                <option value="dianteiro">Somente Dianteiro</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Título do Relatório
              </span>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Título exibido na impressão"
                className="w-full min-h-[44px] px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1B5E42] focus:ring-2 focus:ring-[#1B5E42]/20"
              />
            </label>
          </div>

          {/* Toggle Options */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 border-t border-slate-200">
            <label className="min-h-[44px] inline-flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBreakdown}
                onChange={(e) => setShowBreakdown(e.target.checked)}
                className="w-4 h-4 accent-[#1B5E42] rounded"
              />
              <span>Exibir detalhamento por conferência</span>
            </label>

            <label className="min-h-[44px] inline-flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showNfComparison}
                onChange={(e) => setShowNfComparison(e.target.checked)}
                className="w-4 h-4 accent-[#1B5E42] rounded"
              />
              <span>Exibir comparativo de Peso NF</span>
            </label>

            {hasUnsavedDraft && (
              <label className="min-h-[44px] inline-flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDraft}
                  onChange={(e) => setIncludeDraft(e.target.checked)}
                  className="w-4 h-4 accent-[#1B5E42] rounded"
                />
                <span>Incluir conferência atual não salva</span>
              </label>
            )}
          </div>

          {/* Power BI Tabular Export Controls */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-[#1B5E42] shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  Exportação Tabular para Power BI
                </span>
              </div>
              {exportFeedback && (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B5E42]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{exportFeedback}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Granularidade da Tabela
                </span>
                <select
                  value={pbiGranularity}
                  onChange={(e) =>
                    setPbiGranularity(e.target.value as PowerBiGranularity)
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1B5E42] focus:ring-2 focus:ring-[#1B5E42]/20"
                >
                  <option value="detailed">
                    Detalhado por lançamento (L1/L2)
                  </option>
                  <option value="consolidated">
                    Consolidado por conferência
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Padrão do Arquivo CSV
                </span>
                <select
                  value={pbiDialect}
                  onChange={(e) =>
                    setPbiDialect(e.target.value as TabularCsvDialect)
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1B5E42] focus:ring-2 focus:ring-[#1B5E42]/20"
                >
                  <option value="standard">
                    Power BI Padrão (vírgula / decimal .)
                  </option>
                  <option value="ptbr">
                    Excel / Power BI PT-BR (ponto e vírgula / decimal ,)
                  </option>
                </select>
              </label>

              <button
                type="button"
                disabled={report.conferenceCount === 0}
                onClick={handleExportPowerBi}
                className="min-h-[44px] px-4 py-2 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Table2 className="w-4 h-4" />
                <span>Exportar Power BI (CSV)</span>
              </button>
            </div>

            <p className="text-[11px] sm:text-xs font-mono text-slate-500 leading-relaxed">
              {pbiGranularity === 'detailed'
                ? 'Colunas: IdConferencia, Data, Origem, Corte, Linha, Grupo, PesoTara, PesoTotal, PesoLiquido'
                : 'Colunas: IdConferencia, Data, Origem, PesoNF, TraseiroLiquido, DianteiroLiquido, TotalConferido, DiferencaNF, LancamentosTraseiro, LancamentosDianteiro'}
            </p>
          </div>
        </div>
      </section>

      {/* Generated Printable Report Card */}
      <section
        aria-labelledby="generated-report-title"
        className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden"
      >
        {/* Report Document Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <BrandEmblem className="w-11 h-11 sm:w-12 sm:h-12 shrink-0" />
            <div className="min-w-0">
              <h1
                id="generated-report-title"
                className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight text-balance"
              >
                {customTitle.trim() || 'Relatório de Peso Líquido — Recebimento de Carcaças'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-mono tabular-nums">
                Período: {formatDateBR(startDate)} a {formatDateBR(endDate)} ·{' '}
                {report.conferenceCount}{' '}
                {report.conferenceCount === 1 ? 'conferência' : 'conferências'}
              </p>
            </div>
          </div>
        </div>

        {/* Empty State vs Populated Totals */}
        {report.conferenceCount === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <FileBarChart2 className="w-9 h-9 text-slate-400 mx-auto mb-2.5" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              Nenhuma conferência encontrada neste período
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Ajuste o prazo acima ou salve uma conferência na aba principal para gerar os totais separados de Traseiro e Dianteiro.
            </p>
            <button
              type="button"
              onClick={onGoToWorksheet}
              className="mt-4 min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1B5E42] hover:bg-[#144732] rounded-lg transition-colors"
            >
              Ir para Conferência Diária
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {/* Separate Totals Strip: Traseiro & Dianteiro */}
            <div
              className={`grid grid-cols-1 ${
                showTraseiro && showDianteiro ? 'md:grid-cols-2' : ''
              } divide-y md:divide-y-0 md:divide-x divide-slate-200`}
            >
              {showTraseiro && (
                <div
                  data-testid="report-total-traseiro"
                  className="p-5 sm:p-6 bg-emerald-50/30"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1B5E42]">
                      Peso Líquido Total — Traseiro
                    </span>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      {report.totalTraseiroCount}{' '}
                      {report.totalTraseiroCount === 1 ? 'lançamento' : 'lançamentos'}
                      {showDianteiro && combinedForShare > 0
                        ? ` · ${traseiroPercent.toLocaleString('pt-BR')}%`
                        : ''}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-slate-900">
                      {formatWeight(report.totalTraseiro, true)}
                    </span>
                    <span className="text-sm font-mono text-slate-500">kg</span>
                  </div>
                </div>
              )}

              {showDianteiro && (
                <div
                  data-testid="report-total-dianteiro"
                  className="p-5 sm:p-6 bg-slate-50/50"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Peso Líquido Total — Dianteiro
                    </span>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      {report.totalDianteiroCount}{' '}
                      {report.totalDianteiroCount === 1 ? 'lançamento' : 'lançamentos'}
                      {showTraseiro && combinedForShare > 0
                        ? ` · ${dianteiroPercent.toLocaleString('pt-BR')}%`
                        : ''}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-slate-900">
                      {formatWeight(report.totalDianteiro, true)}
                    </span>
                    <span className="text-sm font-mono text-slate-500">kg</span>
                  </div>
                </div>
              )}
            </div>

            {/* Proportion Visual Bar + Consolidated Totals */}
            <div className="px-5 py-4 sm:px-6 bg-white space-y-3">
              {showTraseiro && showDianteiro && combinedForShare > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-mono tabular-nums">
                    <span>Traseiro ({traseiroPercent.toLocaleString('pt-BR')}%)</span>
                    <span>Dianteiro ({dianteiroPercent.toLocaleString('pt-BR')}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#1B5E42]"
                      style={{ width: `${traseiroPercent}%` }}
                    />
                    <div
                      className="h-full bg-slate-500"
                      style={{ width: `${dianteiroPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-slate-700">
                    Total Líquido no Período:
                  </span>
                  <span
                    data-testid="report-total-geral"
                    className="font-mono font-bold tabular-nums text-slate-900"
                  >
                    {formatWeight(report.totalGeral, true)} kg
                  </span>
                </div>

                {showNfComparison && (
                  <div className="flex flex-wrap items-baseline gap-4 text-xs sm:text-sm font-mono tabular-nums">
                    <span className="text-slate-600">
                      Peso NF Acumulado: {formatWeight(report.totalPesoNF, true)} kg
                    </span>
                    <span
                      className={`font-bold ${
                        report.diferencaNF < 0
                          ? 'text-rose-700'
                          : report.diferencaNF > 0
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      Diferença:{' '}
                      {report.diferencaNF > 0
                        ? `+${formatWeight(report.diferencaNF, true)}`
                        : formatWeight(report.diferencaNF, true)}{' '}
                      kg
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Period Breakdown */}
            {showBreakdown && (
              <div>
                <div className="px-5 py-3 sm:px-6 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Detalhamento por Conferência no Período
                  </h3>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 whitespace-nowrap">
                        <th className="py-2.5 px-4 text-left">Data</th>
                        <th className="py-2.5 px-4 text-left">Origem</th>
                        {showNfComparison && (
                          <th className="py-2.5 px-4 text-right">Peso NF</th>
                        )}
                        {showTraseiro && (
                          <th className="py-2.5 px-4 text-right">Traseiro Líquido</th>
                        )}
                        {showDianteiro && (
                          <th className="py-2.5 px-4 text-right">Dianteiro Líquido</th>
                        )}
                        <th className="py-2.5 px-4 text-right">Total Conferido</th>
                        {showNfComparison && (
                          <th className="py-2.5 px-4 text-right">Diferença NF</th>
                        )}
                        <th className="py-2.5 px-4 text-right no-print">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {report.rows.map((item) => {
                        const dateLabel = formatDateBR(item.sheet.data);
                        const diff = item.summary.diferencaNF;
                        return (
                          <tr
                            key={`${item.sheet.id}-${item.isDraft ? 'draft' : 'saved'}`}
                            className="hover:bg-slate-50/70"
                          >
                            <td className="py-2.5 px-4 font-mono tabular-nums text-slate-900">
                              {dateLabel}
                            </td>
                            <td className="py-2.5 px-4 text-xs text-slate-600">
                              {item.isDraft ? 'Rascunho atual' : 'Salva'}
                            </td>
                            {showNfComparison && (
                              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                                {formatWeight(item.summary.pesoNF, true)} kg
                              </td>
                            )}
                            {showTraseiro && (
                              <td className="py-2.5 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                                {formatWeight(item.summary.traseiroTotal, true)} kg
                              </td>
                            )}
                            {showDianteiro && (
                              <td className="py-2.5 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                                {formatWeight(item.summary.dianteiroTotal, true)} kg
                              </td>
                            )}
                            <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                              {formatWeight(item.summary.conferenciaTotal, true)} kg
                            </td>
                            {showNfComparison && (
                              <td
                                className={`py-2.5 px-4 text-right font-mono font-semibold tabular-nums ${
                                  diff < 0
                                    ? 'text-rose-700'
                                    : diff > 0
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {diff > 0
                                  ? `+${formatWeight(diff, true)}`
                                  : formatWeight(diff, true)}{' '}
                                kg
                              </td>
                            )}
                            <td className="py-2.5 px-4 text-right no-print">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!item.isDraft) {
                                    onLoadSheet(item.sheet);
                                  } else {
                                    onGoToWorksheet();
                                  }
                                }}
                                className="text-xs font-semibold text-[#1B5E42] hover:underline whitespace-nowrap"
                              >
                                {item.isDraft ? 'Continuar' : 'Abrir'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Breakdown List */}
                <div className="md:hidden divide-y divide-slate-200">
                  {report.rows.map((item) => {
                    const dateLabel = formatDateBR(item.sheet.data);
                    const diff = item.summary.diferencaNF;
                    return (
                      <div
                        key={`${item.sheet.id}-${item.isDraft ? 'draft' : 'saved'}-m`}
                        className="p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-mono font-bold text-slate-900">
                            {dateLabel} ·{' '}
                            <span className="font-sans font-normal text-xs text-slate-500">
                              {item.isDraft ? 'Rascunho atual' : 'Salva'}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!item.isDraft) {
                                onLoadSheet(item.sheet);
                              } else {
                                onGoToWorksheet();
                              }
                            }}
                            className="min-h-[36px] px-2.5 text-xs font-semibold text-[#1B5E42] hover:bg-emerald-50 rounded-md"
                          >
                            {item.isDraft ? 'Continuar' : 'Abrir'}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {showTraseiro && (
                            <div>
                              <span className="text-slate-500 block">Traseiro Líquido</span>
                              <span className="font-mono font-bold tabular-nums text-slate-900">
                                {formatWeight(item.summary.traseiroTotal, true)} kg
                              </span>
                            </div>
                          )}
                          {showDianteiro && (
                            <div>
                              <span className="text-slate-500 block">Dianteiro Líquido</span>
                              <span className="font-mono font-bold tabular-nums text-slate-900">
                                {formatWeight(item.summary.dianteiroTotal, true)} kg
                              </span>
                            </div>
                          )}
                        </div>

                        {showNfComparison && (
                          <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-1 text-slate-600">
                            <span>NF: {formatWeight(item.summary.pesoNF, true)} kg</span>
                            <span
                              className={`font-semibold ${
                                diff < 0
                                  ? 'text-rose-700'
                                  : diff > 0
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }`}
                            >
                              Dif: {diff > 0 ? `+${formatWeight(diff, true)}` : formatWeight(diff, true)} kg
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
