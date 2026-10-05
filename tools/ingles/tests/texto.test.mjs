// Pruebas del normalizador y del evaluador. Ejecutar: node tools/ingles/tests/texto.test.mjs
import assert from 'node:assert/strict';
import { canonica, coincide, diferencias, limpiar } from '../../../public/assets/js/ingles/texto.js';
import { evaluar } from '../../../public/assets/js/ingles/evaluador.js';

let pruebas = 0;
const t = (nombre, fn) => { fn(); pruebas++; };

t('mayúsculas y puntuación final', () => {
  assert.ok(coincide('she is a nurse', ['She is a nurse.']));
  assert.ok(coincide('Yes I am', ['Yes, I am.']));
  assert.ok(coincide('  Where   are you from ', ['Where are you from?']));
});

t('apóstrofo tipográfico', () => {
  assert.ok(coincide('I’m tired', ["I'm tired."]));
});

t('contracciones equivalentes', () => {
  assert.ok(coincide("She isn't here", ['She is not here.']));
  assert.ok(coincide("She's not here", ['She is not here.']));
  assert.ok(coincide("I'm from Peru", ['I am from Peru.']));
  assert.ok(coincide("He doesn't work", ['He does not work.']));
  assert.ok(coincide("I can't swim", ['I cannot swim.']));
  assert.ok(coincide("I can not swim", ["I can't swim."]));
  assert.ok(coincide("She's got a car", ['She has got a car.']));
  assert.ok(coincide("I'd like a coffee", ['I would like a coffee.']));
  assert.ok(coincide("There's a bank", ['There is a bank.']));
  assert.ok(coincide("What's your name", ['What is your name?']));
});

t('el genitivo NO se expande', () => {
  assert.equal(canonica("Anna's phone"), "anna's phone");
  assert.ok(!coincide('Anna is phone', ["Anna's phone"]));
  assert.ok(!coincide('my parents house', ["my parents' house"]));
  assert.ok(coincide("my parents' house", ["My parents' house."]));
});

t('literal exige la contracción', () => {
  assert.ok(!coincide('I am', ["I'm"], { literal: true }));
  assert.ok(coincide('i’m', ["I'm"], { literal: true }));
});

t('lo gramaticalmente distinto sigue siendo error', () => {
  assert.ok(!coincide('He work at a hospital', ['He works at a hospital.']));
  assert.ok(!coincide('Does she works here', ['Does she work here?']));
  assert.ok(!coincide('She is have 20 years', ['She is 20.']));
  assert.ok(!coincide('Where you are from', ['Where are you from?']));
});

t('guiones', () => {
  assert.ok(coincide('twenty one', ['twenty-one']));
});

t('diferencias palabra a palabra', () => {
  const d = diferencias('he work at hospital', 'He works at a hospital.');
  assert.deepEqual(d.filter(x => x.tipo !== 'igual').map(x => x.tipo + ':' + x.palabra).sort(),
    ['falta:a', 'falta:works', 'sobra:work'].sort());
});

t('evaluar completar con varios huecos', () => {
  const ej = { tipo: 'completar', frase: '___ she ___ at home?', respuestas: [['Is'], ['working']] };
  assert.equal(evaluar(ej, ['is', 'working']).correcto, true);
  const r = evaluar(ej, ['is', 'work']);
  assert.equal(r.correcto, false);
  assert.deepEqual(r.parcial, [true, false]);
});

t('evaluar: error típico explicado', () => {
  const ej = { tipo: 'traducir', es: 'Él trabaja aquí.', respuestas: ['He works here.'], errores_tipicos: { 'He work here': 'Falta la -s.' } };
  assert.equal(evaluar(ej, 'he work here.').mensaje, 'Falta la -s.');
});

t('evaluar: casi (ortografía)', () => {
  const ej = { tipo: 'traducir', es: '…', respuestas: ['My brother works at a hospital.'] };
  const r = evaluar(ej, 'My brother works at a hopsital');
  assert.equal(r.correcto, false);
  assert.equal(r.casi, true);
});

t('evaluar corregir en dos pasos', () => {
  const ej = { tipo: 'corregir', frase: "He don't like coffee.", error: "don't", correcciones: ["doesn't", 'does not'], frase_correcta: "He doesn't like coffee." };
  assert.equal(evaluar(ej, { seleccion: 'like', correccion: '' }).paso, 'seleccion');
  assert.equal(evaluar(ej, { seleccion: "don't", correccion: 'does not' }).correcto, true);
  assert.equal(evaluar(ej, { seleccion: "don't", correccion: "He doesn't like coffee" }).correcto, true);
  assert.equal(evaluar(ej, { seleccion: "don't", correccion: "doesn't" }).correcto, true);
});

t('limpiar conserva o\'clock', () => {
  assert.equal(limpiar("It's seven o'clock."), "it's seven o'clock");
});

t('mayúsculas cuando el ejercicio las exige', () => {
  assert.ok(!coincide("I'm mexican", ["I'm Mexican."], { mayusculas: true }));
  assert.ok(coincide("I'm Mexican", ["I'm Mexican."], { mayusculas: true }));
  assert.ok(coincide("I am Mexican", ["I'm Mexican."], { mayusculas: true }));
  assert.ok(coincide("She isn't Spanish", ["She is not Spanish."], { mayusculas: true }));
  assert.ok(coincide("i'm mexican", ["I'm Mexican."]));
});

t("nombre + 's not = is not (y el genitivo sigue intacto)", () => {
  assert.ok(coincide("Priya's not a dentist", ['Priya is not a dentist.']));
  assert.ok(coincide("Priya isn't a dentist", ["Priya's not a dentist."]));
  assert.ok(!coincide('Priya is car', ["Priya's car."]));
});

t("sustantivo + 's del estudiante: vale como is/has, pero la aceptada no se degrada", () => {
  assert.ok(coincide("My brother's tall", ['My brother is tall.']));
  assert.ok(coincide("The coffee's too hot", ['The coffee is too hot.']));
  assert.ok(coincide("Tom's got a car", ['Tom has got a car.']));
  assert.ok(coincide("Anna's phone is new", ["Anna's phone is new."]));
  assert.ok(!coincide('Anna is phone is new', ["Anna's phone is new."]));
  assert.ok(!coincide("My brother's tall", ['My brother is short.']));
});

console.log(`texto.test: ${pruebas} pruebas superadas`);
