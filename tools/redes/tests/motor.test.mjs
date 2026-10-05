// Pruebas del motor: invariantes de ip.js por fuerza bruta y miles de ejercicios generados.
// Uso: node tools/redes/tests/motor.test.mjs
import * as IP from '../../../public/assets/js/redes/ip.js';
import { resolver, generar, azar, evaluarCampo, respuestaDe, coincideComando, NIVELES, TIPOS } from '../../../public/assets/js/redes/motor.js';

let fallos = 0, hechos = 0;
const ok = (cond, msg) => { hechos++; if (!cond) { fallos++; if (fallos < 30) console.error('FALLO:', msg); } };

// 1. Referencia independiente con BigInt y cadenas binarias.
const ref = (txt, p) => {
  const bits = txt.split('.').map((o) => Number(o).toString(2).padStart(8, '0')).join('');
  const aIp = (b) => b.match(/.{8}/g).map((x) => parseInt(x, 2)).join('.');
  return { red: aIp(bits.slice(0, p).padEnd(32, '0')), bc: aIp(bits.slice(0, p).padEnd(32, '1')), masc: aIp(''.padEnd(p, '1').padEnd(32, '0')) };
};
const rng = azar(20261005);
for (let i = 0; i < 20000; i++) {
  const d = Math.floor(rng() * 2 ** 32), p = 1 + Math.floor(rng() * 30);
  const t = IP.aTexto(d), r = ref(t, p), a = IP.analizar(d, p);
  ok(IP.aEntero(t) === d, 'ida y vuelta ' + t);
  ok(IP.aTexto(a.red) === r.red && IP.aTexto(a.broadcast) === r.bc && IP.aTexto(a.mascara) === r.masc, `analizar ${t}/${p}`);
  ok(a.broadcast - a.red + 1 === 2 ** (32 - p) && a.hosts === 2 ** (32 - p) - 2, `tamaño ${t}/${p}`);
  ok(IP.prefijoDe(a.mascara) === p, 'prefijoDe');
}
for (let h = 1; h < 70000; h++) { const p = IP.prefijoParaHosts(h); ok(IP.hostsUtiles(p) >= h && (p === 30 || IP.hostsUtiles(p + 1) < h), 'prefijoParaHosts ' + h); }
ok(IP.aEntero('256.1.1.1') === null && IP.aEntero('1.2.3') === null && IP.aEntero('a.b.c.d') === null, 'rechaza IP inválidas');
ok(IP.clase(IP.ip('127.0.0.1')) === 'A' && IP.clase(IP.ip('128.0.0.1')) === 'B' && IP.clase(IP.ip('223.1.1.1')) === 'C' && IP.clase(IP.ip('224.0.0.5')) === 'D', 'clases');
ok(IP.ambito(IP.ip('172.31.255.255')) === 'privada' && IP.ambito(IP.ip('172.32.0.1')) === 'publica' && IP.ambito(IP.ip('192.169.0.1')) === 'publica', 'ámbitos');
const s1 = IP.resumen([{ ip: '192.168.4.0', p: 24 }, { ip: '192.168.5.0', p: 24 }, { ip: '192.168.6.0', p: 24 }, { ip: '192.168.7.0', p: 24 }]);
ok(IP.aTexto(s1.red) === '192.168.4.0' && s1.p === 22 && s1.exacta, 'resumen alineado');
const s2 = IP.resumen([{ ip: '10.1.3.0', p: 24 }, { ip: '10.1.4.0', p: 24 }]);
ok(IP.aTexto(s2.red) === '10.1.0.0' && s2.p === 21 && !s2.exacta, 'resumen no alineado');
const v = IP.vlsm(IP.ip('192.168.1.0'), 24, [{ nombre: 'a', hosts: 20 }, { nombre: 'b', hosts: 100 }, { nombre: 'c', hosts: 2 }, { nombre: 'd', hosts: 50 }]);
ok(v.filas.map((f) => IP.aTexto(f.red) + '/' + f.p).join(' ') === '192.168.1.0/25 192.168.1.128/26 192.168.1.192/27 192.168.1.224/30' && v.sobran === 28, 'vlsm conocido');
ok(IP.vlsm(IP.ip('192.168.1.0'), 24, [{ nombre: 'a', hosts: 200 }, { nombre: 'b', hosts: 100 }]) === null, 'vlsm que no cabe');

// 2. Miles de ejercicios por nivel: se resuelven, sus campos son coherentes y la respuesta correcta se acepta.
const vistos = new Set();
for (const [modulo, niveles] of Object.entries(NIVELES)) for (const nv of niveles) {
  const r = azar(1000 + nv.n);
  for (let i = 0; i < 3000; i++) {
    let spec, ej;
    try { spec = generar(modulo, nv.n, r); ej = resolver(spec); } catch (e) { ok(false, `${modulo} n${nv.n} ${JSON.stringify(spec)}: ${e.message}`); continue; }
    vistos.add(spec.tipo);
    ok(ej.enunciado && ej.campos.length > 0 && ej.pasos.length > 0 && ej.pistas.length === 3, `estructura ${spec.tipo}`);
    ok(JSON.stringify(resolver(JSON.parse(JSON.stringify(spec)))) === JSON.stringify(ej), `determinista ${spec.tipo}`);
    ok(!/undefined|NaN|null|\[object/.test(JSON.stringify(ej)), `texto roto ${JSON.stringify(spec)}`);
    for (const c of ej.campos) {
      ok(evaluarCampo(c, c.tipo === 'opcion' ? String(c.valor) : respuestaDe(c)), `la correcta no se acepta: ${spec.tipo}.${c.id} = ${c.valor}`);
      ok(!evaluarCampo(c, '') && !evaluarCampo(c, 'x'), `acepta basura ${spec.tipo}.${c.id}`);
      if (c.tipo === 'ip') ok(IP.aEntero(c.valor) !== null, `ip inválida ${spec.tipo}.${c.id}`);
      if (c.tipo === 'opcion') ok(c.valor >= 0 && c.valor < c.opciones.length, `opción fuera de rango ${spec.tipo}`);
    }
    // Comprobaciones cruzadas con la referencia independiente.
    if (spec.tipo === 'analizar') {
      const x = ref(spec.ip, spec.p), val = Object.fromEntries(ej.campos.map((c) => [c.id, c.valor]));
      ok(val.red === x.red && val.broadcast === x.bc && val.mascara === x.masc, `analizar ≠ referencia ${spec.ip}/${spec.p}`);
      ok(val.red !== spec.ip && val.broadcast !== spec.ip, `analizar generó red/broadcast ${spec.ip}/${spec.p}`);
    }
    if (spec.tipo === 'vlsm') {
      const redes = ej.campos.filter((c) => c.tipo === 'red').map((c) => c.valor.split('/'));
      for (let a = 0; a < redes.length; a++) {
        ok(ref(redes[a][0], +redes[a][1]).red === redes[a][0], 'vlsm: subred mal alineada');
        ok(ref(redes[a][0], spec.p0).red === ref(spec.base, spec.p0).red, 'vlsm: subred fuera de la base');
        for (let b = a + 1; b < redes.length; b++) ok(ref(redes[b][0], +redes[a][1]).red !== redes[a][0], 'vlsm: subredes solapadas');
      }
    }
    if (spec.tipo === 'vl-diseno') {
      const redes = ej.campos.filter((c) => c.tipo === 'red').map((c) => c.valor.split('/'));
      const gws = ej.campos.filter((c) => c.tipo === 'ip').map((c) => c.valor);
      redes.forEach(([d, p], a) => {
        ok(ref(d, +p).red === d && ref(gws[a], +p).red === d && gws[a] !== d, 'vl-diseno: gateway fuera de su subred');
        for (let b = a + 1; b < redes.length; b++) ok(ref(redes[b][0], +p).red !== d, 'vl-diseno: subredes solapadas');
      });
    }
    if (spec.tipo === 'vl-subinterfaz') {
      const val = Object.fromEntries(ej.campos.map((c) => [c.id, c.valor]));
      const x = ref(val.gw, spec.p);
      ok(x.red === spec.red && val.gw !== x.red && val.gw !== x.bc && val.mascara === x.masc, `vl-subinterfaz: gateway inválido ${JSON.stringify(spec)}`);
    }
    if (spec.tipo === 'resumen') {
      const [d, p] = ej.campos[0].valor.split('/');
      for (const x of spec.redes) ok(ref(x.ip, +p).red === d, 'resumen no contiene a ' + x.ip);
      ok(spec.redes.some((x) => ref(x.ip, +p + 1).red !== ref(spec.redes[0].ip, +p + 1).red) || spec.redes.length === 1, 'resumen no es el más ajustado');
    }
  }
}
for (const t of Object.keys(TIPOS)) if (TIPOS[t].crear) ok(vistos.has(t), 'tipo sin nivel: ' + t);
for (const [esperado, dado, vale] of [
  ['switchport mode access', 'sw mo acc', true], ['switchport mode access', 'SWITCHPORT  MODE ACCESS', true], ['switchport mode access', 'switchport mode trunk', false],
  ['switchport access vlan 20', 'sw acc vl 20', true], ['switchport access vlan 20', 'switchport access vlan 30', false], ['switchport access vlan 20', 'switchport access vlan 2', false],
  ['name VENTAS', 'name ventas', true], ['name VENTAS', 'name VE', false], ['vlan 10', 'vlan10', false], ['vlan 10', 'v 10', false],
  ['switchport trunk allowed vlan 10,20,30', 'sw tr al vl 10,20,30', true], ['switchport trunk allowed vlan 10,20,30', 'sw tr al vl 10,20', false],
  ['interface g0/0.20', 'int gi0/0.20', true], ['interface g0/0.20', 'interface GigabitEthernet0/0.20', true], ['interface g0/0.20', 'interface g 0/0.20', true], ['interface g0/0.20', 'interface g0/0.30', false], ['interface g0/0.20', 'interface g0/1.20', false],
  ['encapsulation dot1q 20', 'encap dot1Q 20', true], ['encapsulation dot1q 20', 'encapsulation dot1q', false], ['show vlan brief', 'sh vl br', true], ['show vlan brief', 'show vlan', false],
]) ok(coincideComando(esperado, dado) === vale, `comando «${dado}» frente a «${esperado}» debía dar ${vale}`);
ok(evaluarCampo({ tipo: 'numero', valor: 65534 }, '65,534') && evaluarCampo({ tipo: 'prefijo', valor: 26 }, '/26') && evaluarCampo({ tipo: 'prefijo', valor: 26 }, '26'), 'formatos tolerados');
ok(evaluarCampo({ tipo: 'red', valor: '10.0.0.0/8' }, '10.0.0.0 / 8') && !evaluarCampo({ tipo: 'red', valor: '10.0.0.0/8' }, '10.0.0.0/9'), 'campo red');
ok(evaluarCampo({ tipo: 'binario', valor: '11000000' }, '1100 0000') && !evaluarCampo({ tipo: 'binario', valor: '11000000' }, '11000001'), 'campo binario');

console.log(`${hechos - fallos}/${hechos} comprobaciones correctas`);
process.exit(fallos ? 1 : 0);
