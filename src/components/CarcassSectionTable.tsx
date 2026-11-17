import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  CarcassRow,
  CutSection,
  LaneKey,
  calculateNetWeight,
  formatWeight,
  sanitizeDecimalInput,
  sumSectionNetWeight,
} from '../utils/carcassMath';

interface CarcassSectionTableProps {
  section: CutSection;
  title: string;
  rows: CarcassRow[];
  onChangeCell: (
    section: CutSection,
    rowId: string,
    lane: LaneKey,
    field: 'tara' | 'pesoTotal',
    value: string
  ) => void;
  onAddRow: (section: CutSection) => void;
  onRemoveRow: (section: CutSection, rowId: string) => void;
}

export const CarcassSectionTable: React.FC<CarcassSectionTableProps> = ({
  section,
  title,
  rows,
  onChangeCell,
  onAddRow,
  onRemoveRow,
}) => {
  const sectionSum = sumSectionNetWeight(rows);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const container = e.currentTarget.closest('[data-section-container]');
    if (!container) return;
    const inputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[data-grid-input="true"]')
    );
    const currentIndex = inputs.indexOf(e.currentTarget);
    if (currentIndex >= 0 && currentIndex + 1 < inputs.length) {
      inputs[currentIndex + 1].focus();
      inputs[currentIndex + 1].select();
    }
  };

  return (
    <section
      data-section-container={section}
      aria-labelledby={`section-heading-${section}`}
      className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden"
    >
      {/* Section Header */}
      <div className="px-4 py-3 bg-[#1B5E42] text-white flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3 min-w-0">
          <h2
            id={`section-heading-${section}`}
            className="text-sm sm:text-base font-extrabold uppercase tracking-wider"
          >
            {title}
          </h2>
          <span className="text-xs text-emerald-100/90 whitespace-nowrap">
            {rows.length} {rows.length === 1 ? 'linha' : 'linhas'}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 whitespace-nowrap shrink-0">
          <span className="text-xs text-emerald-100">Subtotal:</span>
          <span
            data-testid={`subtotal-${section}`}
            className="text-sm sm:text-base font-mono font-bold tabular-nums"
          >
            {formatWeight(sectionSum)} kg
          </span>
        </div>
      </div>

      {/* DESKTOP / TABLET SPREADSHEET GRID (>= 768px): Exact 6-column dual-lane L1 | L2 structure */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            {/* Lane Group Row: L1 | L2 */}
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
              <th
                scope="col"
                className="w-10 py-2 px-2 text-center text-xs font-semibold text-slate-500 border-r border-slate-300"
              >
                #
              </th>
              <th
                colSpan={3}
                scope="colgroup"
                className="py-2 px-3 text-center text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400"
              >
                L1
              </th>
              <th
                colSpan={3}
                scope="colgroup"
                className="py-2 px-3 text-center text-xs font-bold uppercase tracking-wider border-r border-slate-300"
              >
                L2
              </th>
              <th scope="col" className="w-10 py-2 px-1 text-center text-xs font-medium text-slate-500 no-print">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
            {/* Column Subheaders */}
            <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 text-xs font-semibold whitespace-nowrap">
              <th className="py-2 px-2 text-center text-slate-400 border-r border-slate-300">
                Item
              </th>
              <th className="py-2 px-2.5 text-left border-r border-slate-300 w-[14%]">Peso L1</th>
              <th className="py-2 px-2.5 text-left border-r border-slate-300 w-[15%]">Peso Total</th>
              <th className="py-2 px-2.5 text-right border-r-2 border-slate-400 bg-slate-100/70 w-[15%]">
                Peso Líquido
              </th>
              <th className="py-2 px-2.5 text-left border-r border-slate-300 w-[14%]">Peso L2</th>
              <th className="py-2 px-2.5 text-left border-r border-slate-300 w-[15%]">Peso Total</th>
              <th className="py-2 px-2.5 text-right border-r border-slate-300 bg-slate-100/70 w-[15%]">
                Peso Líquido
              </th>
              <th className="py-2 px-1 no-print" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {rows.map((row, idx) => {
              const l1Net = calculateNetWeight(row.l1);
              const l2Net = calculateNetWeight(row.l2);
              const rowNum = idx + 1;
              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-1 px-2 text-center text-xs font-mono text-slate-400 border-r border-slate-300 select-none">
                    {rowNum}
                  </td>

                  {/* L1: Peso L1 */}
                  <td className="p-0 border-r border-slate-300">
                    <input
                      type="text"
                      inputMode="decimal"
                      data-grid-input="true"
                      aria-label={`${title} linha ${rowNum} L1 Peso L1`}
                      placeholder="0"
                      value={row.l1.tara}
                      onKeyDown={handleKeyDown}
                      onChange={(e) =>
                        onChangeCell(
                          section,
                          row.id,
                          'l1',
                          'tara',
                          sanitizeDecimalInput(e.target.value)
                        )
                      }
                      className="w-full h-10 px-2.5 text-right font-mono tabular-nums text-slate-900 placeholder:text-slate-300 bg-transparent focus:outline-none focus:bg-emerald-50/50 focus:ring-2 focus:ring-inset focus:ring-[#1B5E42]"
                    />
                  </td>

                  {/* L1: Peso Total */}
                  <td className="p-0 border-r border-slate-300">
                    <input
                      type="text"
                      inputMode="decimal"
                      data-grid-input="true"
                      aria-label={`${title} linha ${rowNum} L1 Peso Total`}
                      placeholder="0"
                      value={row.l1.pesoTotal}
                      onKeyDown={handleKeyDown}
                      onChange={(e) =>
                        onChangeCell(
                          section,
                          row.id,
                          'l1',
                          'pesoTotal',
                          sanitizeDecimalInput(e.target.value)
                        )
                      }
                      className="w-full h-10 px-2.5 text-right font-mono tabular-nums text-slate-900 placeholder:text-slate-300 bg-transparent focus:outline-none focus:bg-emerald-50/50 focus:ring-2 focus:ring-inset focus:ring-[#1B5E42]"
                    />
                  </td>

                  {/* L1: Peso Líquido */}
                  <td
                    data-testid={`${section}-row-${rowNum}-l1-net`}
                    className={`py-2 px-2.5 text-right font-mono tabular-nums font-semibold border-r-2 border-slate-400 bg-slate-50/80 ${
                      l1Net < 0 ? 'text-rose-700' : l1Net > 0 ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {formatWeight(l1Net)}
                  </td>

                  {/* L2: Peso L2 */}
                  <td className="p-0 border-r border-slate-300">
                    <input
                      type="text"
                      inputMode="decimal"
                      data-grid-input="true"
                      aria-label={`${title} linha ${rowNum} L2 Peso L2`}
                      placeholder="0"
                      value={row.l2.tara}
                      onKeyDown={handleKeyDown}
                      onChange={(e) =>
                        onChangeCell(
                          section,
                          row.id,
                          'l2',
                          'tara',
                          sanitizeDecimalInput(e.target.value)
                        )
                      }
                      className="w-full h-10 px-2.5 text-right font-mono tabular-nums text-slate-900 placeholder:text-slate-300 bg-transparent focus:outline-none focus:bg-emerald-50/50 focus:ring-2 focus:ring-inset focus:ring-[#1B5E42]"
                    />
                  </td>

                  {/* L2: Peso Total */}
                  <td className="p-0 border-r border-slate-300">
                    <input
                      type="text"
                      inputMode="decimal"
                      data-grid-input="true"
                      aria-label={`${title} linha ${rowNum} L2 Peso Total`}
                      placeholder="0"
                      value={row.l2.pesoTotal}
                      onKeyDown={handleKeyDown}
                      onChange={(e) =>
                        onChangeCell(
                          section,
                          row.id,
                          'l2',
                          'pesoTotal',
                          sanitizeDecimalInput(e.target.value)
                        )
                      }
                      className="w-full h-10 px-2.5 text-right font-mono tabular-nums text-slate-900 placeholder:text-slate-300 bg-transparent focus:outline-none focus:bg-emerald-50/50 focus:ring-2 focus:ring-inset focus:ring-[#1B5E42]"
                    />
                  </td>

                  {/* L2: Peso Líquido */}
                  <td
                    data-testid={`${section}-row-${rowNum}-l2-net`}
                    className={`py-2 px-2.5 text-right font-mono tabular-nums font-semibold border-r border-slate-300 bg-slate-50/80 ${
                      l2Net < 0 ? 'text-rose-700' : l2Net > 0 ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {formatWeight(l2Net)}
                  </td>

                  {/* Remove row */}
                  <td className="p-1 text-center no-print">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveRow(section, row.id)}
                        aria-label={`Remover linha ${rowNum} de ${title}`}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE ANDROID CARD ROWS (< 768px): Ergonomic >= 44px touch targets, zero horizontal overflow */}
      <div className="md:hidden divide-y divide-slate-300">
        {rows.map((row, idx) => {
          const rowNum = idx + 1;
          const l1Net = calculateNetWeight(row.l1);
          const l2Net = calculateNetWeight(row.l2);

          return (
            <div key={row.id} className="p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {title} · Linha {rowNum}
                </span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveRow(section, row.id)}
                    aria-label={`Remover linha ${rowNum} de ${title} mobile`}
                    className="min-h-[36px] px-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-700 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>

              {/* Mobile L1 Block */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-2">
                <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    L1
                  </span>
                  <span className="text-xs font-mono font-bold tabular-nums text-slate-900">
                    Líq: {formatWeight(l1Net)} kg
                  </span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <label className="block px-2.5 py-1.5 bg-white focus-within:bg-emerald-50/40">
                    <span className="block text-[11px] font-medium text-slate-500">
                      Peso L1
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`${title} mobile linha ${rowNum} L1 Peso L1`}
                      placeholder="0,00"
                      value={row.l1.tara}
                      onChange={(e) =>
                        onChangeCell(
                          section,
                          row.id,
                          'l1',
                          'tara',
                          sanitizeDecimalInput(e.target.value)
                        )
                      }
                      className="w-full min-h-[44px] text-base font-mono tabular-nums text-slate-900 placeholder:text-slate-300 bg-transparent focus:outline-none"
                    />
                  </label>
                  <label className="block px-2.5 py-1.5 bg-white focus-within:bg-emerald-50/40">
                    <span className="block text-[11px] font-medium text-slate-500">
                      Peso Total
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`${title} mobile linha ${rowNum} L1 Peso Total`}
                      placeholder="0,00"
                      value={row.l1.pesoTotal}
                      onChange={(e) =>
                        onChangeCell(
                          section,
                          row.id,
                          'l1',
                          'pesoTotal',
                          sanitizeDecimalInput(e.target.value)
                        )
                      }
                      className="w-full min-h-[44px] text-base font-mono tabular-nums text-slate-900 placeholder:text-slate-300 bg-transparent focus:outline-none"
                    />
                  </label>
                </div>
              </div>

              {/* Mobile L2 Block */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    L2
                  </span>
                  <span className="text-xs font-mono font-bold tabular-nums text-slate-900">
                    Líq: {formatWeight(l2Net)} kg
                  </span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <label className="block px-2.5 py-1.5 bg-white focus-within:bg-emerald-50/40">
                    <span className="block text-[11px] font-medium text-slate-500">
                      Peso L2
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`${title} mobile linha ${rowNum} L2 Peso L2`}
                      placeholder="0,00"
                      value={row.l2.tara}
                      onChange={(e) =>
                        onChangeCell(
                          section,
                          row.id,
                          'l2',
                          'tara',
                          sanitizeDecimalInput(e.target.value)
                        )
                      }
                      className="w-full min-h-[44px] text-base font-mono tabular-nums text-slate-900 placeholder:text-slate-300 bg-transparent focus:outline-none"
                    />
                  </label>
                  <label className="block px-2.5 py-1.5 bg-white focus-within:bg-emerald-50/40">
                    <span className="block text-[11px] font-medium text-slate-500">
                      Peso Total
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`${title} mobile linha ${rowNum} L2 Peso Total`}
                      placeholder="0,00"
                      value={row.l2.pesoTotal}
                      onChange={(e) =>
                        onChangeCell(
                          section,
                          row.id,
                          'l2',
                          'pesoTotal',
                          sanitizeDecimalInput(e.target.value)
                        )
                      }
                      className="w-full min-h-[44px] text-base font-mono tabular-nums text-slate-900 placeholder:text-slate-300 bg-transparent focus:outline-none"
                    />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Footer: Add Row */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-300 flex items-center justify-between gap-4 no-print">
        <button
          type="button"
          onClick={() => onAddRow(section)}
          className="min-h-[44px] px-3.5 py-2 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1B5E42] hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar linha em {title}</span>
        </button>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Fórmula: Peso Líquido = Peso Total - Peso L1/L2
        </span>
      </div>
    </section>
  );
};
