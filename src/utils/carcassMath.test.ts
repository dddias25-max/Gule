import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNetWeight,
  sumSectionNetWeight,
  calculateSheetSummary,
  parseDecimalInput,
  createEmptySheet,
  formatWeight,
} from './carcassMath';

test('parseDecimalInput handles Portuguese comma and dot decimals', () => {
  assert.equal(parseDecimalInput('145,50'), 145.5);
  assert.equal(parseDecimalInput('145.50'), 145.5);
  assert.equal(parseDecimalInput('1.250,25'), 1250.25);
  assert.equal(parseDecimalInput(''), null);
  assert.equal(parseDecimalInput('   '), null);
});

test('calculateNetWeight computes Peso Total minus Peso L1/L2', () => {
  assert.equal(calculateNetWeight({ tara: '2,5', pesoTotal: '152,5' }), 150);
  assert.equal(calculateNetWeight({ tara: '1.8', pesoTotal: '121.8' }), 120);
  assert.equal(calculateNetWeight({ tara: '', pesoTotal: '140' }), 140);
  // Blank Peso Total yields 0 even if tara is typed first
  assert.equal(calculateNetWeight({ tara: '2,5', pesoTotal: '' }), 0);
  // Explicit 0 Peso Total yields 0 - tara
  assert.equal(calculateNetWeight({ tara: '2', pesoTotal: '0' }), -2);
});

test('sumSectionNetWeight sums L1 and L2 net weights separately', () => {
  const sheet = createEmptySheet('2026-11-16');
  sheet.traseiro[0].l1 = { tara: '2,5', pesoTotal: '152,5' }; // 150
  sheet.traseiro[0].l2 = { tara: '3', pesoTotal: '103' }; // 100
  sheet.traseiro[1].l1 = { tara: '1,5', pesoTotal: '91,5' }; // 90

  assert.equal(sumSectionNetWeight(sheet.traseiro), 340);
  assert.equal(sumSectionNetWeight(sheet.dianteiro), 0);
});

test('calculateSheetSummary computes Traseiro, Dianteiro, and Diferenca NF/Conferencia', () => {
  const sheet = createEmptySheet('2026-11-16');
  sheet.pesoNF = '500';
  sheet.traseiro[0].l1 = { tara: '2,5', pesoTotal: '152,5' }; // 150
  sheet.traseiro[0].l2 = { tara: '3', pesoTotal: '103' }; // 100
  sheet.dianteiro[0].l1 = { tara: '2', pesoTotal: '122' }; // 120

  const summary = calculateSheetSummary(sheet);
  assert.equal(summary.traseiroTotal, 250);
  assert.equal(summary.dianteiroTotal, 120);
  assert.equal(summary.conferenciaTotal, 370);
  assert.equal(summary.pesoNF, 500);
  assert.equal(summary.diferencaNF, -130);
  assert.equal(summary.traseiroCount, 2);
  assert.equal(summary.dianteiroCount, 1);
});

test('formatWeight formats cleanly for zero and decimals', () => {
  assert.equal(formatWeight(0), '0');
  assert.equal(formatWeight(250), '250');
  assert.equal(formatWeight(145.5), '145,50');
  assert.equal(formatWeight(250, true), '250,00');
});
