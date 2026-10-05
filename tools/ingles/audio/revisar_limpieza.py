"""Comprueba que texto_para_voz() no pierde palabras inglesas (desarrollo).
Uso: ~/.local/share/tutoriales-tts/bin/python tools/ingles/audio/revisar_limpieza.py [--todo]"""
import json, re, sys
from pathlib import Path
sys.argv = sys.argv[:1] + [a for a in sys.argv[1:]]
sys.path.insert(0, str(Path(__file__).parent))
import generar as g
g.ES = set(json.loads((g.AUDIO / 'voces.json').read_text(encoding='utf-8'))['espanol'])
corpus = json.loads(g.CORPUS.read_text(encoding='utf-8'))
palabra = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
perdidas = 0
for c in corpus['clips']:
    for acento in ('us', 'gb'):
        t, f = g.texto_para_voz(c['texto'], acento)
        if acento == 'gb':
            continue
        salida = re.sub(r'\[([^\]]+)\]\(/[^)]*/\)', r'\1', t) if t else ''
        origen = g.IPA_RE.sub(' ', c['texto'])
        origen = re.sub(r'\([^)]*\)', lambda m: '' if g.tiene_espanol(m.group(0)) else m.group(0), origen)
        faltan = [w for w in palabra.findall(origen) if w.lower() not in salida.lower() and not g.tiene_espanol(w)
                  and w.lower() not in ('ee', 'uu') and not re.fullmatch('[A-Z]', w)]
        if (faltan and t) or (t is None and f is None) or '--todo' in sys.argv:
            perdidas += bool(faltan) or (t is None and f is None)
            print(repr(c['texto'])[:100], '→', repr(salida) if t else ('/' + f + '/' if f else 'NADA'), '· faltan:', faltan)
print('clips con palabras perdidas o sin audio:', perdidas)
