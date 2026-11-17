import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptySheet } from './carcassMath';
import {
  buildPeriodReport,
  buildPowerBiTabularCsv,
  getPresetRange,
  isDateInRange,
} from './carcassReport';

test('getPresetRange computes today, last7, month, and last30 ranges cleanly', () => {
  assert.deepEqual(getPresetRange('today', '2026-11-16'), {
    startDate: '2026-11-16',
    endDate: '2026-11-16',
  });
  assert.deepEqual(getPresetRange('last7', '2026-11-16'), {
    startDate: '2026-11-10',
    endDate: '2026-11-16',
  });
  assert.deepEqual(getPresetRange('month', '2026-11-16'), {
    startDate: '2026-11-01',
    endDate: '2026-11-16',
  });
  assert.deepEqual(getPresetRange('last30', '2026-11-16'), {
    startDate: '2026-10-18',
    endDate: '2026-11-16',
  });
});

test('isDateInRange filters inclusive YYYY-MM-DD boundaries', () => {
  assert.equal(isDateInRange('2026-11-10', '2026-11-10', '2026-11-16'), true);
  assert.equal(isDateInRange('2026-11-16', '2026-11-10', '2026-11-16'), true);
  assert.equal(isDateInRange('2026-11-09', '2026-11-10', '2026-11-16'), false);
  assert.equal(isDateInRange('2026-11-17', '2026-11-10', '2026-11-16'), false);
});

test('buildPeriodReport aggregates Traseiro and Dianteiro separately across stipulated period', () => {
  const day1 = createEmptySheet('2026-11-10');
  day1.pesoNF = '300';
  day1.traseiro[0].l1 = { tara: '2', pesoTotal: '152' }; // 150
  day1.dianteiro[0].l1 = { tara: '1', pesoTotal: '101' }; // 100

  const day2 = createEmptySheet('2026-11-15');
  day2.pesoNF = '400';
  day2.traseiro[0].l2 = { tara: '3', pesoTotal: '203' }; // 200
  day2.dianteiro[0].l2 = { tara: '2', pesoTotal: '152' }; // 150

  const outsideDay = createEmptySheet('2026-10-25');
  outsideDay.traseiro[0].l1 = { tara: '0', pesoTotal: '999' };

  const draft = createEmptySheet('2026-11-16');
  draft.pesoNF = '100';
  draft.traseiro[0].l1 = { tara: '1', pesoTotal: '51' }; // 50

  const withoutDraft = buildPeriodReport([day1, day2, outsideDay], draft, {
    startDate: '2026-11-10',
    endDate: '2026-11-16',
    cutScope: 'both',
    includeDraft: false,
  });

  assert.equal(withoutDraft.conferenceCount, 2);
  assert.equal(withoutDraft.totalTraseiro, 350);
  assert.equal(withoutDraft.totalDianteiro, 250);
  assert.equal(withoutDraft.totalGeral, 600);
  assert.equal(withoutDraft.totalPesoNF, 700);
  assert.equal(withoutDraft.diferencaNF, -100);

  const withDraft = buildPeriodReport([day1, day2, outsideDay], draft, {
    startDate: '2026-11-10',
    endDate: '2026-11-16',
    cutScope: 'both',
    includeDraft: true,
  });

  assert.equal(withDraft.conferenceCount, 3);
  assert.equal(withDraft.totalTraseiro, 400);
  assert.equal(withDraft.totalDianteiro, 250);
  assert.equal(withDraft.totalGeral, 650);

  const onlyTraseiro = buildPeriodReport([day1, day2], null, {
    startDate: '2026-11-10',
    endDate: '2026-11-16',
    cutScope: 'traseiro',
    includeDraft: false,
  });
  assert.equal(onlyTraseiro.totalGeral, 350);
});

test('buildPowerBiTabularCsv generates flat header+rows CSV without summary clutter', () => {
  const day1 = createEmptySheet('2026-11-10');
  day1.id = 'conf-1';
  day1.pesoNF = '300';
  day1.traseiro[0].l1 = { tara: '2,5', pesoTotal: '152,5' }; // 150
  day1.dianteiro[0].l2 = { tara: '1', pesoTotal: '101' }; // 100

  const filter = {
    startDate: '2026-11-01',
    endDate: '2026-11-16',
    cutScope: 'both' as const,
    includeDraft: false,
  };
  const report = buildPeriodReport([day1], null, filter);

  const consolidated = buildPowerBiTabularCsv(report, filter, 'consolidated', 'standard');
  const consLines = consolidated.split('\n');
  assert.equal(consLines.length, 2);
  assert.equal(
    consLines[0],
    'IdConferencia,Data,Origem,PesoNF,TraseiroLiquido,DianteiroLiquido,TotalConferido,DiferencaNF,LancamentosTraseiro,LancamentosDianteiro'
  );
  assert.equal(
    consLines[1],
    'conf-1,2026-11-10,Salva,300.00,150.00,100.00,250.00,-50.00,1,1'
  );

  const detailedPtBr = buildPowerBiTabularCsv(report, filter, 'detailed', 'ptbr');
  const detLines = detailedPtBr.split('\n');
  assert.equal(detLines.length, 3);
  assert.equal(
    detLines[0],
    'IdConferencia;Data;Origem;Corte;Linha;Grupo;PesoTara;PesoTotal;PesoLiquido'
  );
  assert.equal(detLines[1], 'conf-1;2026-11-10;Salva;Traseiro;1;L1;2,50;152,50;150,00');
  assert.equal(detLines[2], 'conf-1;2026-11-10;Salva;Dianteiro;1;L2;1,00;101,00;100,00');
});
