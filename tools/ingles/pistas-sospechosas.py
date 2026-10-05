#!/usr/bin/env python3
"""
Academia de Inglés · detector de pistas que regalan la respuesta (desarrollo).

La pista 3 debe enunciar la regla exacta, pero NO escribir la respuesta. Este
detector marca candidatas (heurística: la pista cita las respuestas de los
huecos, o contiene casi todas las palabras de la oración pedida, o cita la
opción correcta). Un humano decide: no todas son fugas reales.

  python3 tools/ingles/pistas-sospechosas.py <unidad>      lista con id y pista
  python3 tools/ingles/pistas-sospechosas.py               recuento por unidad
"""
import glob, json, re, sys

def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[.,!?¿¡;:\"«»()]", " ", s.lower().replace("’", "'"))).strip()

def sospechosa(e):
    p = e.get('pistas') or []
    if len(p) < 3:
        return False
    h = ' ' + norm(p[2]) + ' '
    t = e['tipo']
    if t == 'completar':
        return all(re.search(r"(→|=|«|\")\s*" + re.escape(l[0].lower()), p[2].lower()) for l in e['respuestas'])
    if t in ('traducir', 'transformar', 'ordenar'):
        r = norm(e['respuestas'][0]).split()
        return len(r) >= 3 and sum(1 for w in r if ' ' + w + ' ' in h) / len(r) >= 0.85
    if t in ('opcion', 'conversacion'):
        c = [o['texto'] for o in e['opciones'] if o.get('correcta')][0]
        return len(norm(c)) > 3 and ('«' + c.lower() in p[2].lower() or '"' + c.lower() in p[2].lower())
    return False

def ejercicios(u):
    for l in u['lecciones']:
        yield from l['ejercicios']
    yield from u['evaluacion']['preguntas']

filtro = sys.argv[1] if len(sys.argv) > 1 else None
for f in sorted(glob.glob('public/assets/ingles/data/unidades/*.json')):
    u = json.load(open(f))
    if filtro and u['slug'] != filtro:
        continue
    malos = [e for e in ejercicios(u) if sospechosa(e)]
    if filtro:
        for e in malos:
            print(f"{e['id']} [{e['tipo']}]\n   respuesta: {e.get('respuestas', e.get('solucion', {}).get('respuesta'))}\n   pista 3: {e['pistas'][2]}")
    else:
        print(f"{len(malos):3d} {u['slug']}")
