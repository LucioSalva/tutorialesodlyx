"""
Academia de Inglés · verificación del audio (herramienta de desarrollo)
=====================================================================
Comprueba, para cada acento:

  1. Archivos: todo clip del inventario (corpus.json) y toda pista completa
     existe, no está vacía, se decodifica (ffprobe) y dura algo razonable
     para su texto.
  2. Pistas: la duración del MP3 coincide con la del .json de tiempos y los
     segmentos coinciden con el inventario actual.
  3. Huérfanos: MP3 que ya no usa ningún texto (texto cambiado, voz
     cambiada…). Con --borrar-huerfanos se eliminan.
  4. Contenido (--asr): Whisper transcribe CADA clip y se compara con el texto
     sintetizado (tasa de error de palabras). Primero con small.en; lo dudoso
     se repite con medium.en. El resultado queda en el manifiesto.

Uso:
  ~/.local/share/tutoriales-tts/bin/python tools/ingles/audio/verificar.py [--asr] [--borrar-huerfanos]
"""
import json, re, subprocess, sys, time, unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import generar as g

ASR = '--asr' in sys.argv
BORRAR = '--borrar-huerfanos' in sys.argv
voces = json.loads((g.AUDIO / 'voces.json').read_text(encoding='utf-8'))
g.ES = set(voces['espanol'])
corpus = json.loads(g.CORPUS.read_text(encoding='utf-8'))
manifiesto = json.loads(g.MANIFIESTO.read_text(encoding='utf-8'))
acentos = list(voces['acentos'])
problemas = []


def duracion(ruta):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(ruta)],
                       capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return None


def plano(t):
    """Texto sintetizado sin el marcado de fonemas y sin tildes (para comparar con Whisper)."""
    t = re.sub(r'( @[\d.]+| #\w+)+$', '', t)   # marcas de velocidad o voz de una variante
    t = re.sub(r'\[([^\]]+)\]\(/[^)]*/\)', r'\1', t)
    return ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')


# ------------------------------------------------------------ 1. archivos
usados = set()
t0 = time.time()
for acento in acentos:
    faltan = vacios = rotos = raros = 0
    for c in corpus['clips']:
        texto, fon = g.texto_para_voz(c['texto'], acento)
        if texto is None and fon is None:
            continue
        rel = c['rutas'][acento]
        usados.add(rel)
        f = g.AUDIO / rel
        if not f.exists():
            faltan += 1; problemas.append(f'FALTA {rel} «{c["texto"]}»'); continue
        if f.stat().st_size < 500:
            vacios += 1; problemas.append(f'VACÍO {rel}'); continue
        m = manifiesto['clips'].get(rel)
        d = m['duracion'] if m else duracion(f)
        if d is None:
            rotos += 1; problemas.append(f'NO DECODIFICA {rel}'); continue
        letras = len(re.sub(r'[^A-Za-z]', '', plano(texto or '')))
        if texto and (d < 0.15 or d > 2.0 + letras * 0.14 or (letras > 20 and d < letras * 0.03)):
            raros += 1; problemas.append(f'DURACIÓN RARA {d:.2f}s para {letras} letras: {rel} «{c["texto"]}»')
    print(f'{acento}: clips · faltan {faltan} · vacíos {vacios} · no decodifican {rotos} · duración rara {raros}', flush=True)

    for p in corpus['pistas']:
        base = g.AUDIO / p['tipo'] / acento / p['slug']
        usados.add(str(base.with_suffix('.mp3').relative_to(g.AUDIO)))
        if not base.with_suffix('.mp3').exists() or not base.with_suffix('.json').exists():
            problemas.append(f'FALTA PISTA {p["tipo"]}/{acento}/{p["slug"]}'); continue
        meta = json.loads(base.with_suffix('.json').read_text(encoding='utf-8'))
        d = duracion(base.with_suffix('.mp3'))
        if d is None or abs(d - meta['duracion']) > 0.12:
            problemas.append(f'PISTA {p["tipo"]}/{acento}/{p["slug"]}: MP3 {d}s ≠ json {meta["duracion"]}s')
        if [s['texto'] for s in meta['segmentos']] != [s['texto'] for s in p['segmentos']]:
            problemas.append(f'PISTA {p["tipo"]}/{acento}/{p["slug"]}: segmentos distintos del inventario (regenerar)')
        if any(b['inicio'] < a['fin'] for a, b in zip(meta['segmentos'], meta['segmentos'][1:])):
            problemas.append(f'PISTA {p["tipo"]}/{acento}/{p["slug"]}: segmentos solapados')
    print(f'{acento}: {len(corpus["pistas"])} pistas revisadas', flush=True)

# ------------------------------------------------------------ 3. huérfanos
huerfanos = [f for f in g.AUDIO.rglob('*.mp3') if str(f.relative_to(g.AUDIO)) not in usados]
print(f'huérfanos: {len(huerfanos)}', flush=True)
for f in huerfanos:
    if BORRAR:
        f.unlink()
        manifiesto['clips'].pop(str(f.relative_to(g.AUDIO)), None)
if BORRAR:
    for d in sorted(g.AUDIO.rglob('*'), reverse=True):
        if d.is_dir() and not any(d.iterdir()):
            d.rmdir()
manifiesto['clips'] = {k: v for k, v in manifiesto['clips'].items() if k in usados}

# ---------------------------------------------------------- 4. contenido
if ASR:
    import torch  # carga las bibliotecas CUDA (cublas) que necesita faster-whisper
    from faster_whisper import WhisperModel
    from whisper_normalizer.english import EnglishTextNormalizer
    norm = EnglishTextNormalizer()

    def wer(ref, hip):
        r, h = norm(ref).split(), norm(hip).split()
        d = list(range(len(h) + 1))
        for i in range(1, len(r) + 1):
            prev, d[0] = d[0], i
            for j in range(1, len(h) + 1):
                prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
        return d[len(h)] / max(1, len(r))

    rapido = WhisperModel('small.en', device='cuda', compute_type='float16')
    fino = None
    revisados = dudosos = 0
    for rel, m in manifiesto['clips'].items():
        s = m['sintetizado']
        if s.startswith('/'):
            continue  # demostración solo con fonemas: no hay texto con el que comparar
        ref = plano(s)
        if m.get('asr', {}).get('config') == m['config'] and m['asr'].get('ref') == ref:
            continue  # ya verificado con este mismo audio
        oido = ' '.join(x.text for x in rapido.transcribe(str(g.AUDIO / rel), language='en', beam_size=1)[0]).strip()
        w = wer(ref, oido)
        modelo = 'small.en'
        if w > 0:
            fino = fino or WhisperModel('medium.en', device='cuda', compute_type='float16')
            oido2 = ' '.join(x.text for x in fino.transcribe(str(g.AUDIO / rel), language='en', beam_size=5)[0]).strip()
            w2 = wer(ref, oido2)
            if w2 <= w:
                oido, w, modelo = oido2, w2, 'medium.en'
        m['asr'] = {'oido': oido, 'wer': round(w, 3), 'modelo': modelo, 'ref': ref, 'config': m['config']}
        revisados += 1
        if revisados % 1000 == 0:
            g.MANIFIESTO.write_text(json.dumps(manifiesto, ensure_ascii=False, indent=0), encoding='utf-8')
            print(f'  ASR: {revisados} · {time.time() - t0:.0f} s', flush=True)
    todos = [m for m in manifiesto['clips'].values() if 'asr' in m]
    for m in todos:
        a = m['asr']
        palabras = len(norm(a['ref']).split())
        if (palabras >= 3 and a['wer'] > 0.2) or (palabras < 3 and a['wer'] >= 1):
            dudosos += 1
            problemas.append(f'ASR {m["acento"]}/{m["voz"]} WER={a["wer"]:.2f} «{a["ref"]}» → oído «{a["oido"]}»')
    exactos = sum(1 for m in todos if m['asr']['wer'] == 0)
    print(f'ASR: {len(todos)} clips comparados · {exactos} idénticos ({100 * exactos / max(1, len(todos)):.1f} %) · {dudosos} a revisar', flush=True)

g.MANIFIESTO.write_text(json.dumps(manifiesto, ensure_ascii=False, indent=0), encoding='utf-8')
informe = Path(__file__).with_name('verificacion.txt')
informe.write_text('\n'.join(problemas) + '\n', encoding='utf-8')
print(f'{len(problemas)} problemas → {informe}')
sys.exit(1 if any(p.startswith(('FALTA', 'VACÍO', 'NO DECODIFICA', 'PISTA')) for p in problemas) else 0)
