"""
Academia de Inglés · muestras comparativas de voces (herramienta de desarrollo).

Genera las mismas frases originales de la academia con varias voces de
Kokoro-82M y las mide de forma objetiva:

  · Whisper (faster-whisper, local) transcribe cada muestra → ¿se entiende
    exactamente lo que dice el texto? (tasa de error de palabras, WER)
  · ffmpeg mide volumen integrado (LUFS), pico y silencios de los extremos.

Uso:  ~/.local/share/tutoriales-tts/bin/python tools/ingles/audio/muestras.py <carpeta_salida>
"""
import json, re, subprocess, sys, time
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KPipeline
from faster_whisper import WhisperModel

SALIDA = Path(sys.argv[1] if len(sys.argv) > 1 else 'muestras')
SALIDA.mkdir(parents=True, exist_ok=True)

TEXTOS = {
    'palabra': 'Wednesday',
    'afirmacion': 'My brother works at a hospital.',
    'pregunta': 'Does your brother work at a hospital?',
    'contracciones': "I'm tired, but she isn't. They're at home and we aren't.",
    'dificiles': 'I thought about the world on Wednesday. It is comfortable to work through three, thirteen, and thirty.',
    'lectura': "Good morning, everyone! Hi! My name is Lucía. I'm a student. I'm from Mexico, from Puebla. This is my friend Omar. He's from Egypt.",
    'dialogo_a': "Nice to meet you, too. Are you from here, Aisha?",
    'dialogo_b': "No, I'm not. I'm from Egypt. And you? Where are you from?",
}

VOCES = {
    'a': ['af_heart', 'af_bella', 'af_nicole', 'am_michael', 'am_fenrir', 'am_puck'],
    'b': ['bf_emma', 'bf_isabella', 'bm_george', 'bm_fable'],
}


def normal(s):
    s = s.lower().replace('’', "'").replace('í', 'i')
    s = re.sub(r"[^a-z0-9' ]+", ' ', s)
    return s.split()


def wer(ref, hip):
    r, h = normal(ref), normal(hip)
    d = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1): d[i][0] = i
    for j in range(len(h) + 1): d[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i][j] = min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (r[i-1] != h[j-1]))
    return d[-1][-1] / max(1, len(r))


def medir(ruta):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(ruta), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    lufs = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1])
    pico = float(re.findall(r'Peak:\s+(-?[\d.inf]+) dBFS', out)[-1])
    return lufs, pico


def silencios(audio, sr, umbral=0.01):
    idx = np.where(np.abs(audio) > umbral)[0]
    if not len(idx): return len(audio) / sr, 0.0
    return idx[0] / sr, (len(audio) - idx[-1]) / sr


asr = WhisperModel('medium.en', device='cuda', compute_type='float16')
filas = []
for lang, voces in VOCES.items():
    pipe = KPipeline(lang_code=lang)
    for voz in voces:
        for clave, texto in TEXTOS.items():
            t0 = time.time()
            trozos = [a for _, _, a in pipe(texto, voice=voz, speed=1.0)]
            audio = np.concatenate([np.asarray(a) for a in trozos])
            gen = time.time() - t0
            ruta = SALIDA / f'{voz}__{clave}.wav'
            sf.write(ruta, audio, 24000)
            segs, _ = asr.transcribe(str(ruta), language='en', beam_size=5)
            hip = ' '.join(s.text for s in segs).strip()
            lufs, pico = medir(ruta)
            ini, fin = silencios(audio, 24000)
            filas.append(dict(voz=voz, clave=clave, texto=texto, oido=hip, wer=round(wer(texto, hip), 3),
                              lufs=lufs, pico=pico, dur=round(len(audio) / 24000, 2), sil_ini=round(ini, 2),
                              sil_fin=round(fin, 2), rtf=round(gen / (len(audio) / 24000), 3)))
            print(f"{voz:12s} {clave:13s} WER={filas[-1]['wer']:.2f} LUFS={lufs:6.1f} pico={pico:5.1f}  «{hip}»", flush=True)

(SALIDA / 'informe.json').write_text(json.dumps(filas, ensure_ascii=False, indent=1))
print('\nWER medio por voz:')
for voz in [v for vs in VOCES.values() for v in vs]:
    f = [x for x in filas if x['voz'] == voz]
    print(f"  {voz:12s} {sum(x['wer'] for x in f) / len(f):.3f}   (errores en: {', '.join(x['clave'] for x in f if x['wer'] > 0) or 'ninguna'})")
