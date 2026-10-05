"""
Segunda pasada para los audios que Whisper marcó (herramienta de desarrollo).

Para cada clip dudoso del manifiesto prueba variantes de síntesis (punto
final, velocidad 0,95 y ambas), transcribe cada una con Whisper medium.en y
guarda en variantes.json la que MEJORA la tasa de error. Si ninguna mejora,
se queda el audio original. Después hay que ejecutar generar.py (regenera
solo esos clips) y verificar.py --asr.

  ~/.local/share/tutoriales-tts/bin/python tools/ingles/audio/mejorar.py
"""
import json, re, sys, tempfile
from pathlib import Path

import soundfile as sf

sys.path.insert(0, str(Path(__file__).parent))
import generar as g
import torch  # noqa: F401  (bibliotecas CUDA para faster-whisper)
from faster_whisper import WhisperModel
from whisper_normalizer.english import EnglishTextNormalizer

voces = json.loads((g.AUDIO / 'voces.json').read_text(encoding='utf-8'))
g.ES = set(voces['espanol'])
manifiesto = json.loads(g.MANIFIESTO.read_text(encoding='utf-8'))
corpus = json.loads(g.CORPUS.read_text(encoding='utf-8'))
norm = EnglishTextNormalizer()


def wer(ref, hip):
    r, h = norm(ref).split(), norm(hip).split()
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
    return d[len(h)] / max(1, len(r))


def dudoso(a):
    n = len(norm(a['ref']).split())
    return (n >= 3 and a['wer'] > 0.2) or (n < 3 and a['wer'] >= 1)


ALTERNATIVAS = {
    'us': {'f': ['af_heart', 'af_bella', 'af_nicole'], 'm': ['am_michael', 'am_puck', 'am_fenrir']},
    'gb': {'f': ['bf_emma', 'bf_isabella'], 'm': ['bm_george', 'bm_fable']},
}
rol_de = {}
for c in corpus['clips']:
    for acento, rel in c['rutas'].items():
        rol_de[rel] = c['rol']

asr = WhisperModel('medium.en', device='cuda', compute_type='float16')
sint = g.Sintetizador()
variantes = dict(g.VARIANTES)
candidatos = [(rel, m) for rel, m in manifiesto['clips'].items() if 'asr' in m and dudoso(m['asr']) and not m['sintetizado'].startswith('/')]
print(f'{len(candidatos)} clips dudosos', flush=True)
mejorados = 0
for n, (rel, m) in enumerate(candidatos, 1):
    texto, fon = g.texto_para_voz(m['texto'], m['acento'])
    if texto is None:
        continue
    ref = re.sub(r'\[([^\]]+)\]\(/[^)]*/\)', r'\1', texto)
    punto = {} if re.search(r'[.!?…]["\')]*$', texto.strip()) else {'sufijo': '.'}
    opciones = [{'velocidad': 0.95}] + ([punto, {**punto, 'velocidad': 0.95}] if punto else [])
    # Voces alternativas del MISMO acento y género que la del rol.
    rol = rol_de.get(rel, m['rol'])
    genero = 'f' if rol in ('n', 'f') else 'm'
    for alt in ALTERNATIVAS[m['acento']][genero]:
        if alt != voces['acentos'][m['acento']]['roles'][rol]:
            opciones.append({**punto, 'voz': alt})
    mejor, mejor_wer, mejor_oido = None, m['asr']['wer'], m['asr']['oido']
    for op in opciones:
        # sin «voz» explícita = la voz del rol (así se guarda y así se regenera)
        voz_rol = voces['acentos'][m['acento']]['roles'][rol]
        a = g.normalizar_volumen(g.recortar(sint(texto, None, m['acento'], op.get('voz', voz_rol), op.get('sufijo', ''), op.get('velocidad', 1.0))))
        with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
            sf.write(tmp.name, a, g.SR)
            oido = ' '.join(x.text for x in asr.transcribe(tmp.name, language='en', beam_size=5)[0]).strip()
        w = wer(ref, oido)
        if w < mejor_wer - 1e-9:
            mejor, mejor_wer, mejor_oido = op, w, oido
    clave = f"{m['acento']}|{rol}|{m['texto']}"
    if mejor:
        variantes[clave] = mejor
        mejorados += 1
        print(f"  ✓ {m['voz']:11s} {m['asr']['wer']:.2f}→{mejor_wer:.2f} {mejor} «{ref[:60]}» → «{mejor_oido[:60]}»", flush=True)
    if n % 100 == 0:
        print(f'  {n}/{len(candidatos)} · {mejorados} mejorados', flush=True)

g._VARIANTES_RUTA.write_text(json.dumps(variantes, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{mejorados} de {len(candidatos)} mejorados → variantes.json ({len(variantes)} en total)')
