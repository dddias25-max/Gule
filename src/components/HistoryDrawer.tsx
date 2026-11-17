import React, { useState } from 'react';
import { Trash2, X, FileSpreadsheet } from 'lucide-react';
import {
  ConferenceSheet,
  calculateSheetSummary,
  formatWeight,
} from '../utils/carcassMath';

interface HistoryDrawerProps {
  isOpen: boolean;
  history: ConferenceSheet[];
  onClose: () => void;
  onLoadSheet: (sheet: ConferenceSheet) => void;
  onDeleteSheet: (id: string) => void;
}

function formatDateBR(dateISO: string): string {
  if (!dateISO) return 'Sem data';
  const parts = dateISO.split('-');
  if (parts.length !== 3) return dateISO;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  history,
  onClose,
  onLoadSheet,
  onDeleteSheet,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
    >
      <div
        className="flex-1"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-slate-200 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2
              id="history-drawer-title"
              className="text-base font-bold text-slate-900"
            >
              Histórico Diário
            </h2>
            <p className="text-xs text-slate-500">
              {history.length} {history.length === 1 ? 'conferência salva' : 'conferências salvas'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar histórico"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Nenhuma conferência salva ainda
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Preencha os pesos do dia e toque em &ldquo;Salvar Conferência&rdquo; para manter seu registro diário.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const summary = calculateSheetSummary(item);
              const dateLabel = formatDateBR(item.data);
              const isConfirming = confirmDeleteId === item.id;

              return (
                <article
                  key={item.id}
                  className="border border-slate-200 rounded-xl p-3.5 bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {dateLabel}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Peso NF: {formatWeight(summary.pesoNF)} kg · Total Conf: {formatWeight(summary.conferenciaTotal)} kg
                      </p>
                    </div>
                    <span
                      className={`text-xs font-mono font-semibold tabular-nums ${
                        summary.diferencaNF < 0
                          ? 'text-rose-700'
                          : summary.diferencaNF > 0
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      Dif: {summary.diferencaNF > 0 ? `+${formatWeight(summary.diferencaNF)}` : formatWeight(summary.diferencaNF)} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-xs mb-3">
                    <div>
                      <span className="text-slate-500 block">Traseiro</span>
                      <span className="font-mono font-bold tabular-nums text-slate-900">
                        {formatWeight(summary.traseiroTotal)} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Dianteiro</span>
                      <span className="font-mono font-bold tabular-nums text-slate-900">
                        {formatWeight(summary.dianteiroTotal)} kg
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadSheet(item);
                        onClose();
                      }}
                      aria-label={`Carregar conferência de ${dateLabel}`}
                      className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1B5E42] hover:bg-[#144732] rounded-lg transition-colors"
                    >
                      Carregar na planilha
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSheet(item.id);
                            setConfirmDeleteId(null);
                          }}
                          aria-label={`Confirmar exclusão de ${dateLabel}`}
                          className="min-h-[40px] px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[40px] px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        aria-label={`Excluir conferência de ${dateLabel}`}
                        className="min-h-[40px] px-2.5 py-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
