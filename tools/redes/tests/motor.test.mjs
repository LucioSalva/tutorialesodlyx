// Pruebas del motor: invariantes de ip.js por fuerza bruta y miles de ejercicios generados.
// Uso: node tools/redes/tests/motor.test.mjs [--solo <modulo>]
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as V6 from '../../../public/assets/js/redes/ipv6.js';
import * as IP from '../../../public/assets/js/redes/ip.js';
import { resolver, generar, azar, evaluarCampo, respuestaDe, valorCorrecto, coincideComando, cargarBanco, NIVELES, TIPOS } from '../../../public/assets/js/redes/motor.js';

const solo = process.argv.includes('--solo') ? process.argv[process.argv.indexOf('--solo') + 1] : null;
for (const modulo of Object.keys(NIVELES)) {
  const ruta = fileURLToPath(new URL(`../contenido/banco-${modulo}.mjs`, import.meta.url));
  if (existsSync(ruta)) cargarBanco(modulo, (await import(ruta)).default);
}
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
  if (solo && modulo !== solo) continue;
  const r = azar(1000 + nv.n);
  for (let i = 0; i < 3000; i++) {
    let spec, ej;
    try { spec = generar(modulo, nv.n, r); ej = resolver(spec); } catch (e) { ok(false, `${modulo} n${nv.n} ${JSON.stringify(spec)}: ${e.message}`); continue; }
    vistos.add(spec.tipo);
    ok(ej.enunciado && ej.campos.length > 0 && ej.pasos.length > 0 && (ej.pistas.length === 3 || (ej.pistas.length === 0 && 'pregunta' in spec)) && ej.pasos.every((x) => x.t), `estructura ${spec.tipo}`);
    ok(JSON.stringify(resolver(JSON.parse(JSON.stringify(spec)))) === JSON.stringify(ej), `determinista ${spec.tipo}`);
    ok(!/undefined|NaN|null|\[object/.test(JSON.stringify(ej)), `texto roto ${JSON.stringify(spec)}`);
    for (const c of ej.campos) {
      ok(evaluarCampo(c, valorCorrecto(c)), `la correcta no se acepta: ${spec.tipo}.${c.id} = ${c.valor} ${JSON.stringify(spec).slice(0, 200)}`);
      ok(respuestaDe(c) !== '' && respuestaDe(c) !== 'undefined', `respuesta vacía ${spec.tipo}.${c.id}`);
      ok(!evaluarCampo(c, '') && !evaluarCampo(c, 'x'), `acepta basura ${spec.tipo}.${c.id}`);
      if (c.tipo === 'ip') ok(IP.aEntero(c.valor) !== null, `ip inválida ${spec.tipo}.${c.id}`);
      if (c.tipo === 'opcion') ok(c.valor >= 0 && c.valor < c.opciones.length && new Set(c.opciones).size === c.opciones.length, `opción fuera de rango o repetida ${spec.tipo} ${JSON.stringify(spec).slice(0, 200)}`);
      if (c.tipo === 'multi') ok(c.valor.length >= 2 && c.valor.every((x) => x >= 0 && x < c.opciones.length), `multi fuera de rango ${spec.tipo}`);
      if (c.tipo === 'ipv6') ok(V6.grupos(c.valor) !== null, `ipv6 inválida ${spec.tipo}.${c.id}`);
      if (c.tipo === 'mac') ok(V6.mac(c.valor) !== null, `mac inválida ${spec.tipo}.${c.id}`);
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
if (!solo) for (const t of Object.keys(TIPOS)) if (TIPOS[t].crear) ok(vistos.has(t), 'tipo sin nivel: ' + t);
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

// 3. IPv6, MAC y los campos nuevos.
for (const [texto, corta, larga] of [
  ['2001:0db8:0000:0000:0000:0000:0000:0001', '2001:db8::1', '2001:0db8:0000:0000:0000:0000:0000:0001'],
  ['2001:DB8:0:0:1:0:0:1', '2001:db8::1:0:0:1', '2001:0db8:0000:0000:0001:0000:0000:0001'],
  ['fe80::1', 'fe80::1', 'fe80:0000:0000:0000:0000:0000:0000:0001'], ['::', '::', '0000:0000:0000:0000:0000:0000:0000:0000'], ['::1', '::1', '0000:0000:0000:0000:0000:0000:0000:0001'],
  ['2001:db8:0:1:0:0:0:0', '2001:db8:0:1::', '2001:0db8:0000:0001:0000:0000:0000:0000'], ['2001:0:0:1:0:0:0:1', '2001:0:0:1::1', '2001:0000:0000:0001:0000:0000:0000:0001'],
  ['2001:db8:0:1:1:1:1:1', '2001:db8:0:1:1:1:1:1', '2001:0db8:0000:0001:0001:0001:0001:0001'],
]) { const g = V6.grupos(texto); ok(g && V6.corta(g) === corta && V6.larga(g) === larga && V6.corta(V6.grupos(corta)) === corta, 'ipv6 ' + texto); }
for (const malo of ['2001:db8::1::2', '2001:db8', '1:2:3:4:5:6:7:8:9', '2001:db8::g', '12345::1', '', '1:2:3:4:5:6:7::8']) ok(V6.grupos(malo) === null, 'ipv6 inválida aceptada: ' + malo);
ok(V6.tipo6(V6.grupos('fe80::1')) === 'link-local' && V6.tipo6(V6.grupos('febf::1')) === 'link-local' && V6.tipo6(V6.grupos('fd00::1')) === 'unica-local' && V6.tipo6(V6.grupos('ff02::1')) === 'multicast'
  && V6.tipo6(V6.grupos('2001:db8::1')) === 'documentacion' && V6.tipo6(V6.grupos('2607:f8b0::1')) === 'global' && V6.tipo6(V6.grupos('::1')) === 'loopback' && V6.tipo6(V6.grupos('::')) === 'sin-especificar', 'tipos de IPv6');
ok(V6.corta(V6.prefijo6(V6.grupos('2001:db8:acad:1234:abcd::1'), 64)) === '2001:db8:acad:1234::' && V6.corta(V6.prefijo6(V6.grupos('2001:db8:acad:12ff::1'), 56)) === '2001:db8:acad:1200::', 'prefijo6');
ok(V6.macTexto(V6.mac('00-1A-2B-3C-4D-5E')) === '00:1a:2b:3c:4d:5e' && V6.macTexto(V6.mac('001a.2b3c.4d5e'), '.') === '001a.2b3c.4d5e' && V6.mac('00:1a:2b:3c:4d') === null && V6.mac('00:1a:2b:3c:4d:zz') === null, 'mac');
ok(V6.corta([0xfe80, 0, 0, 0, ...V6.eui64(V6.mac('00:1a:2b:3c:4d:5e'))]) === 'fe80::21a:2bff:fe3c:4d5e', 'eui-64');
ok(evaluarCampo({ tipo: 'ipv6', valor: '2001:db8::1' }, '2001:0DB8:0:0:0:0:0:1') && !evaluarCampo({ tipo: 'ipv6', valor: '2001:db8::1', forma: 'corta' }, '2001:db8:0::1')
  && evaluarCampo({ tipo: 'ipv6', valor: '2001:db8::1', forma: 'corta' }, '2001:DB8::1') && !evaluarCampo({ tipo: 'ipv6', valor: '2001:db8::1' }, '2001:db8::2'), 'campo ipv6');
ok(evaluarCampo({ tipo: 'red6', valor: '2001:db8:1::/64' }, '2001:db8:1:0::/64') && !evaluarCampo({ tipo: 'red6', valor: '2001:db8:1::/64' }, '2001:db8:1::/48'), 'campo red6');
ok(evaluarCampo({ tipo: 'mac', valor: '00:1a:2b:3c:4d:5e' }, '001A.2B3C.4D5E') && !evaluarCampo({ tipo: 'mac', valor: '00:1a:2b:3c:4d:5e' }, '00:1a:2b:3c:4d:5f'), 'campo mac');
ok(evaluarCampo({ tipo: 'multi', valor: [0, 2] }, '2,0') && !evaluarCampo({ tipo: 'multi', valor: [0, 2] }, '0') && !evaluarCampo({ tipo: 'multi', valor: [0, 2] }, '0,1,2'), 'campo multi');
ok(evaluarCampo({ tipo: 'texto', valor: 'ipconfig /all' }, ' IPCONFIG  /all ') && !evaluarCampo({ tipo: 'texto', valor: 'ipconfig /all' }, 'ipconfig') && evaluarCampo({ tipo: 'texto', valor: 'ip addr', acepta: ['ip a'] }, 'ip a'), 'campo texto');
ok(evaluarCampo({ tipo: 'hex', valor: 'ff' }, '0xFF') && !evaluarCampo({ tipo: 'hex', valor: 'ff' }, 'fe'), 'campo hex');
const rel = resolver({ tipo: 'relacionar', pregunta: 'x', pares: [['HTTP', '80'], ['HTTPS', '443'], ['SSH', '22']], extra: ['23'], porque: 'y' });
ok(rel.campos.length === 3 && rel.campos.every((c) => c.opciones.join() === '22,23,80,443') && rel.campos[1].valor === 3, 'relacionar');
const ordn = resolver({ tipo: 'ordenar', pregunta: 'x', orden: ['Discover', 'Offer', 'Request', 'Acknowledge'], pasos: ['a', 'b'] });
ok(ordn.campos.map((c) => c.opciones[c.valor]).join() === 'Discover,Offer,Request,Acknowledge' && ordn.pasos.length === 2, 'ordenar');

console.log(`${hechos - fallos}/${hechos} comprobaciones correctas`);
process.exit(fallos ? 1 : 0);
