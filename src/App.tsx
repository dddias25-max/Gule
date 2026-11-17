import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Download,
  History,
  Printer,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  ConferenceSheet,
  CutSection,
  LaneKey,
  buildCsvReport,
  calculateSheetSummary,
  createEmptyRow,
  createEmptySheet,
} from './utils/carcassMath';
import {
  loadDraftSheet,
  loadHistorySheets,
  saveDraftSheet,
  saveHistorySheets,
} from './utils/storage';
import { BrandEmblem } from './components/BrandEmblem';
import { ConferenceHeaderCard } from './components/ConferenceHeaderCard';
import { CarcassSectionTable } from './components/CarcassSectionTable';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ReportView } from './components/ReportView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

type MobileSectionFilter = 'all' | CutSection;
type ActiveTab = 'worksheet' | 'report';

export default function App() {
  const [sheet, setSheet] = useState<ConferenceSheet>(() => loadDraftSheet());
  const [history, setHistory] = useState<ConferenceSheet[]>(() =>
    loadHistorySheets()
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('worksheet');
  const [isDraftDirty, setIsDraftDirty] = useState<boolean>(false);
  const [sectionFilter, setSectionFilter] = useState<MobileSectionFilter>('all');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const summary = useMemo(() => calculateSheetSummary(sheet), [sheet]);

  // Persist current draft automatically on every edit
  useEffect(() => {
    saveDraftSheet(sheet);
  }, [sheet]);

  // Auto-dismiss save notice after 3 seconds
  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);

  const handleChangeData = (value: string) => {
    setIsDraftDirty(true);
    setSheet((prev) => ({
      ...prev,
      data: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleChangePesoNF = (value: string) => {
    setIsDraftDirty(true);
    setSheet((prev) => ({
      ...prev,
      pesoNF: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleChangeCell = (
    section: CutSection,
    rowId: string,
    lane: LaneKey,
    field: 'tara' | 'pesoTotal',
    value: string
  ) => {
    setIsDraftDirty(true);
    setSheet((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      [section]: prev[section].map((row) =>
        row.id === rowId
          ? {
              ...row,
              [lane]: {
                ...row[lane],
                [field]: value,
              },
            }
          : row
      ),
    }));
  };

  const handleAddRow = (section: CutSection) => {
    setIsDraftDirty(true);
    setSheet((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      [section]: [
        ...prev[section],
        createEmptyRow(section, prev[section].length + 1),
      ],
    }));
  };

  const handleRemoveRow = (section: CutSection, rowId: string) => {
    setIsDraftDirty(true);
    setSheet((prev) => {
      if (prev[section].length <= 1) return prev;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        [section]: prev[section].filter((r) => r.id !== rowId),
      };
    });
  };

  const handleSaveConference = () => {
    const snapshot: ConferenceSheet = {
      ...sheet,
      id: `conf-${Date.now().toString(36)}`,
      updatedAt: new Date().toISOString(),
    };
    const nextHistory = [snapshot, ...history];
    setHistory(nextHistory);
    saveHistorySheets(nextHistory);
    setIsDraftDirty(false);
    setSaveNotice('Conferência salva no histórico diário.');
  };

  const handleLoadFromHistory = (loaded: ConferenceSheet) => {
    setSheet({
      ...loaded,
      updatedAt: new Date().toISOString(),
    });
    setIsDraftDirty(false);
    setConfirmReset(false);
    setActiveTab('worksheet');
    setSaveNotice('Conferência carregada na planilha.');
  };

  const handleDeleteFromHistory = (id: string) => {
    const next = history.filter((item) => item.id !== id);
    setHistory(next);
    saveHistorySheets(next);
  };

  const hasAnyInput =
    sheet.pesoNF.trim() !== '' ||
    sheet.traseiro.some(
      (r) =>
        r.l1.tara !== '' ||
        r.l1.pesoTotal !== '' ||
        r.l2.tara !== '' ||
        r.l2.pesoTotal !== ''
    ) ||
    sheet.dianteiro.some(
      (r) =>
        r.l1.tara !== '' ||
        r.l1.pesoTotal !== '' ||
        r.l2.tara !== '' ||
        r.l2.pesoTotal !== ''
    );

  const handleResetSheet = () => {
    if (hasAnyInput && !confirmReset) {
      setActiveTab('worksheet');
      setConfirmReset(true);
      return;
    }
    setSheet(createEmptySheet());
    setIsDraftDirty(false);
    setConfirmReset(false);
    setActiveTab('worksheet');
    setSaveNotice('Nova conferência iniciada.');
  };

  const handleExportCsv = () => {
    const csv = buildCsvReport(sheet);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conferencia-carcacas-${sheet.data || 'sem-data'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col overflow-x-hidden">
      {/* Top Navigation Bar (3-Zone Contract, <= 56px sticky height) */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
        <div className="max-w-5xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-8">
          {/* Zone 1: Brand Title */}
          <a
            href="#top"
            className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap min-w-0"
          >
            <BrandEmblem className="w-7 h-7 shrink-0" />
            <span className="truncate">Conferência de Carcaças</span>
          </a>

          {/* Zone 2: Concise single-line nav links/actions (Desktop) */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => setActiveTab('worksheet')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'worksheet'
                  ? 'text-[#1B5E42] font-semibold border-[#1B5E42]'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Conferência
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'report'
                  ? 'text-[#1B5E42] font-semibold border-[#1B5E42]'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Relatórios
            </button>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="py-1 border-b-2 border-transparent hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Histórico ({history.length})
            </button>
            <button
              type="button"
              onClick={handleResetSheet}
              className="py-1 border-b-2 border-transparent hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Nova Conferência
            </button>
          </nav>

          {/* Zone 3: Primary CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              aria-label="Abrir histórico diário"
              className="md:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleSaveConference}
              className="min-h-[40px] sm:min-h-[40px] px-3.5 sm:px-4 py-2 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-[#1B5E42] hover:bg-[#144732] active:scale-[0.98] rounded-lg transition-all whitespace-nowrap shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Mobile Primary Tab Switcher (< 768px) */}
        <div
          role="tablist"
          aria-label="Alternar entre Conferência Diária e Relatórios"
          className="md:hidden grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-xl no-print"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'worksheet'}
            onClick={() => setActiveTab('worksheet')}
            className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'worksheet'
                ? 'bg-white text-[#1B5E42] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Conferência Diária
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'report'}
            onClick={() => setActiveTab('report')}
            className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'report'
                ? 'bg-white text-[#1B5E42] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Relatórios
          </button>
        </div>

        {/* Inline confirmation for Nova Conferência (replaces window.confirm) */}
        {confirmReset && (
          <div
            role="alert"
            className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 no-print"
          >
            <p className="text-xs sm:text-sm font-medium text-amber-950">
              Deseja limpar os pesos atuais para iniciar uma nova conferência?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetSheet}
                className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg"
              >
                Sim, limpar planilha
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[40px] px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Inline save / status notice */}
        {saveNotice && (
          <div
            role="status"
            aria-live="polite"
            className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-900 no-print"
          >
            <Check className="w-4 h-4 text-[#1B5E42] shrink-0" />
            <span>{saveNotice}</span>
          </div>
        )}

        {activeTab === 'report' ? (
          <ReportView
            history={history}
            draft={sheet}
            hasUnsavedDraft={hasAnyInput && (isDraftDirty || history.length === 0)}
            onGoToWorksheet={() => setActiveTab('worksheet')}
            onLoadSheet={handleLoadFromHistory}
          />
        ) : (
          <>
            {/* Top Summary Card (Data, Peso NF, Traseiro, Dianteiro, Diferença NF/Conferência) */}
            <ConferenceHeaderCard
              data={sheet.data}
              pesoNF={sheet.pesoNF}
              summary={summary}
              onChangeData={handleChangeData}
              onChangePesoNF={handleChangePesoNF}
            />

            {/* Worksheet Toolbar (Desktop Export/Print + Mobile Filter & Actions) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 no-print">
              <div
                role="tablist"
                aria-label="Filtrar seção da planilha"
                className="md:hidden grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-xl"
              >
                {(
                  [
                    { key: 'all', label: 'Todos' },
                    { key: 'traseiro', label: 'Traseiro' },
                    { key: 'dianteiro', label: 'Dianteiro' },
                  ] as const
                ).map((tab) => {
                  const active = sectionFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSectionFilter(tab.key)}
                      className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <p className="hidden md:block text-xs text-slate-500">
                Preenchimento diário · Rascunho salvo automaticamente
              </p>

              <div className="flex items-center justify-between md:justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetSheet}
                  className="md:hidden min-h-[44px] px-3 py-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Nova</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="min-h-[44px] md:min-h-[38px] px-3 py-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="min-h-[44px] md:min-h-[38px] px-3 py-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TRASEIRO Section */}
            {(sectionFilter === 'all' || sectionFilter === 'traseiro') && (
              <CarcassSectionTable
                section="traseiro"
                title="Traseiro"
                rows={sheet.traseiro}
                onChangeCell={handleChangeCell}
                onAddRow={handleAddRow}
                onRemoveRow={handleRemoveRow}
              />
            )}

            {/* DIANTEIRO Section */}
            {(sectionFilter === 'all' || sectionFilter === 'dianteiro') && (
              <CarcassSectionTable
                section="dianteiro"
                title="Dianteiro"
                rows={sheet.dianteiro}
                onChangeCell={handleChangeCell}
                onAddRow={handleAddRow}
                onRemoveRow={handleRemoveRow}
              />
            )}
          </>
        )}
      </main>

      <footer className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 no-print">
        <span>Rascunho salvo automaticamente no dispositivo</span>
        <span>
          Total geral conferido: {summary.conferenciaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
        </span>
      </footer>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        history={history}
        onClose={() => setIsHistoryOpen(false)}
        onLoadSheet={handleLoadFromHistory}
        onDeleteSheet={handleDeleteFromHistory}
      />

      <OfflineIndicator />
    </div>
  );
}
