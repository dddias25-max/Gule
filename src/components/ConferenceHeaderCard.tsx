import React from 'react';
import {
  SheetSummary,
  formatWeight,
  sanitizeDecimalInput,
} from '../utils/carcassMath';
import { BrandEmblem } from './BrandEmblem';

interface ConferenceHeaderCardProps {
  data: string;
  pesoNF: string;
  summary: SheetSummary;
  onChangeData: (value: string) => void;
  onChangePesoNF: (value: string) => void;
}

export const ConferenceHeaderCard: React.FC<ConferenceHeaderCardProps> = ({
  data,
  pesoNF,
  summary,
  onChangeData,
  onChangePesoNF,
}) => {
  const hasNF = pesoNF.trim() !== '';
  const diff = summary.diferencaNF;

  let diffLabel = 'Zerado';
  let diffColorClass = 'text-slate-900';

  if (hasNF || summary.conferenciaTotal > 0) {
    if (Math.abs(diff) < 0.005) {
      diffLabel = 'Conforme NF';
      diffColorClass = 'text-emerald-700';
    } else if (diff < 0) {
      diffLabel = 'Abaixo da NF';
      diffColorClass = 'text-rose-700';
    } else {
      diffLabel = 'Acima da NF';
      diffColorClass = 'text-amber-700';
    }
  }

  return (
    <section
      aria-labelledby="conference-title"
      className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden"
    >
      {/* Title Row */}
      <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-200 flex items-center gap-4 bg-white">
        <BrandEmblem className="w-11 h-11 sm:w-13 sm:h-13 shrink-0" />
        <div className="min-w-0">
          <h1
            id="conference-title"
            className="text-base sm:text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 uppercase leading-tight text-balance"
          >
            Conferência do Recebimento de Carcaças
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Preencha os pesos L1, L2 e Total para cálculo automático do peso líquido
          </p>
        </div>
      </div>

      {/* Structured Summary Grid matching the reference spreadsheet top block */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-300">
        {/* Left Side: DATA & PESO NF */}
        <div className="divide-y divide-slate-300 md:border-r md:border-slate-300">
          {/* DATA */}
          <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] items-stretch">
            <label
              htmlFor="input-data"
              className="px-3.5 py-2.5 sm:px-4 bg-slate-50 border-r border-slate-300 flex items-center text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide"
            >
              Data
            </label>
            <div className="flex items-center bg-white">
              <input
                id="input-data"
                type="date"
                value={data}
                onChange={(e) => onChangeData(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm sm:text-base font-mono font-medium text-slate-900 bg-transparent focus:outline-none focus:bg-emerald-50/40 focus:ring-2 focus:ring-inset focus:ring-[#1B5E42]"
              />
            </div>
          </div>

          {/* PESO NF */}
          <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] items-stretch border-b border-slate-300 md:border-b-0">
            <label
              htmlFor="input-peso-nf"
              className="px-3.5 py-2.5 sm:px-4 bg-slate-50 border-r border-slate-300 flex items-center text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide"
            >
              Peso NF
            </label>
            <div className="relative flex items-center bg-white">
              <input
                id="input-peso-nf"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={pesoNF}
                onChange={(e) => onChangePesoNF(sanitizeDecimalInput(e.target.value))}
                className="w-full min-h-[44px] pl-3.5 pr-10 py-2 text-sm sm:text-base font-mono font-semibold text-right tabular-nums text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none focus:bg-emerald-50/40 focus:ring-2 focus:ring-inset focus:ring-[#1B5E42]"
              />
              <span className="pr-3.5 text-xs font-mono text-slate-500 select-none">
                kg
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Traseiro & Dianteiro Totals */}
        <div className="divide-y divide-slate-300">
          {/* Traseiro: */}
          <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] items-stretch">
            <div className="px-3.5 py-2.5 sm:px-4 bg-slate-50 border-r border-slate-300 flex flex-col justify-center">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Traseiro:
              </span>
              <span className="text-[11px] text-slate-500">
                {summary.traseiroCount} {summary.traseiroCount === 1 ? 'lançamento' : 'lançamentos'}
              </span>
            </div>
            <div
              data-testid="summary-traseiro"
              className="min-h-[44px] px-3.5 py-2 flex items-center justify-end gap-1.5 bg-emerald-50/35"
            >
              <span className="text-base sm:text-lg font-mono font-bold tabular-nums text-slate-900">
                {formatWeight(summary.traseiroTotal)}
              </span>
              <span className="text-xs font-mono text-slate-500">kg</span>
            </div>
          </div>

          {/* Dianteiro: */}
          <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] items-stretch">
            <div className="px-3.5 py-2.5 sm:px-4 bg-slate-50 border-r border-slate-300 flex flex-col justify-center">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Dianteiro:
              </span>
              <span className="text-[11px] text-slate-500">
                {summary.dianteiroCount} {summary.dianteiroCount === 1 ? 'lançamento' : 'lançamentos'}
              </span>
            </div>
            <div
              data-testid="summary-dianteiro"
              className="min-h-[44px] px-3.5 py-2 flex items-center justify-end gap-1.5 bg-emerald-50/35"
            >
              <span className="text-base sm:text-lg font-mono font-bold tabular-nums text-slate-900">
                {formatWeight(summary.dianteiroTotal)}
              </span>
              <span className="text-xs font-mono text-slate-500">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Spanning Row: DIFERENÇA NF/CONFERÊNCIA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 items-stretch bg-slate-50/70">
        <div className="px-3.5 py-3 sm:px-4 border-b sm:border-b-0 sm:border-r border-slate-300 flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
            Diferença NF/Conferência
          </span>
          <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
            Conf: {formatWeight(summary.conferenciaTotal)} kg
          </span>
        </div>
        <div
          data-testid="summary-diferenca"
          className="px-3.5 py-2.5 sm:px-4 flex items-center justify-between sm:justify-end gap-3 bg-white"
        >
          <span className={`text-xs font-semibold ${diffColorClass}`}>
            {diffLabel}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-base sm:text-lg font-mono font-bold tabular-nums ${diffColorClass}`}>
              {diff > 0 ? `+${formatWeight(diff)}` : formatWeight(diff)}
            </span>
            <span className="text-xs font-mono text-slate-500">kg</span>
          </div>
        </div>
      </div>
    </section>
  );
};
