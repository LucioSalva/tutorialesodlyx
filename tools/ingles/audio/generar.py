"""
Academia de Inglés · generador de audio (herramienta de desarrollo)
=====================================================================
Sintetiza con Kokoro-82M (pesos Apache 2.0, en local, sin API ni coste)
cada frase del inventario (corpus.json, de recolectar.mjs) y cada pista
completa de lecturas y escucha. No se ejecuta nunca en el hosting.

Flujo por frase:
  texto de la página → texto_para_voz() (quita AFI, aclaraciones en español,
  flechas; aplica el léxico de nombres) → Kokoro → recorte de silencios →
  volumen normalizado (−19 LUFS, pico ≤ −1,5 dBFS) → MP3 mono 24 kHz →
  public/assets/ingles/audio/<acento>/<voz>/<h0h1>/<hash>.mp3

Pistas completas: se encadenan los MISMOS audios de cada frase con pausas
fijas, así que las marcas de tiempo del .json son exactas (no estimadas).

Incremental: si el MP3 ya existe y el manifiesto dice que se generó con la
misma configuración (CONFIG_VERSION), no se regenera.

Uso:
  ~/.local/share/tutoriales-tts/bin/python tools/ingles/audio/generar.py [us|gb|todos] [--solo-pistas] [--limite N]
"""
import hashlib, json, os, re, subprocess, sys, tempfile, time
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

RAIZ = Path(__file__).resolve().parents[3]
AUDIO = RAIZ / 'public/assets/ingles/audio'
CORPUS = Path(__file__).with_name('corpus.json')
MANIFIESTO = AUDIO / 'manifest.json'
SR = 24000
CONFIG_VERSION = 'kokoro-0.9.4/v1/speed1.0/lufs-19/mp3-q5'   # cambiarla fuerza la regeneración
LUFS = -19.0
PICO = 10 ** (-1.5 / 20)
PAUSA_FRASE = 0.35      # entre frases de un párrafo (s)
PAUSA_PARRAFO = 0.80    # entre párrafos
PAUSA_LINEA = 0.55      # entre intervenciones de un diálogo

# ------------------------------------------------------------------ léxico
# Nombres que el conversor texto→fonemas pronuncia mal. Notación de misaki
# (la de Kokoro): A = /eɪ/, I = /aɪ/, O = /oʊ/ (EE. UU.), Q = /əʊ/ (R. U.).
LEXICO = {
    'us': {
        'Lucía': 'lusˈiə', 'Sofía': 'sOfˈiə', 'Querétaro': 'kəɹˈɛtəɹO', 'León': 'lAˈOn', 'Cancún': 'kænkˈun',
        'Mérida': 'mˈɛɹɪdə', 'Juárez': 'wˈɑɹɛz', 'Inés': 'inˈɛs', 'Tulum': 'tulˈum', 'Priya': 'pɹˈijə',
        'García': 'ɡɑɹsˈiə', 'Cristóbal': 'kɹistˈObəl', 'Cusco': 'kˈuskO', 'Luis': 'luˈis', 'Machu': 'mˈɑʧu',
        'Raúl': 'ɹɑˈul', 'Teresa': 'təɹˈAsə', 'Torres': 'tˈɔɹɛs', 'Vallarta': 'vɑjˈɑɹtə', 'Samira': 'səmˈiɹə',
        'Karim': 'kəɹˈim', 'Hernández': 'hɛɹnˈɑndɛs', 'Albán': 'ɑlbˈɑn', 'Ortiz': 'ɔɹtˈis', 'Pérez': 'pˈɛɹɛs',
        'Tuxtla': 'tˈustlə', 'Toño': 'tˈOnjO', 'Iván': 'ivˈɑn', 'Díaz': 'dˈiɑs', 'Lía': 'lˈiə', 'Ruiz': 'ɹuˈis',
        'Puebla': 'pwˈɛblə', 'pizarrón': 'pisəɹˈOn', 'Aisha': 'ˈIʃə',
    },
    'gb': {
        'Lucía': 'luːsˈiːə', 'Sofía': 'səfˈiːə', 'Querétaro': 'kəɹˈɛtəɹQ', 'León': 'lAˈɒn', 'Cancún': 'kaŋkˈuːn',
        'Mérida': 'mˈɛɹɪdə', 'Juárez': 'wˈɑːɹɛz', 'Inés': 'iːnˈɛs', 'Tulum': 'tuːlˈuːm', 'Priya': 'pɹˈiːjə',
        'García': 'ɡɑːsˈiːə', 'Cristóbal': 'kɹɪstˈQbəl', 'Cusco': 'kˈuːskQ', 'Luis': 'luːˈiːs', 'Machu': 'mˈaʧuː',
        'Raúl': 'ɹɑːˈuːl', 'Teresa': 'təɹˈAzə', 'Torres': 'tˈɒɹɛs', 'Vallarta': 'vajˈɑːtə', 'Samira': 'səmˈɪəɹə',
        'Karim': 'kəɹˈiːm', 'Hernández': 'hɛːnˈandɛs', 'Albán': 'albˈɑːn', 'Ortiz': 'ɔːtˈiːs', 'Pérez': 'pˈɛɹɛs',
        'Tuxtla': 'tˈʊstlə', 'Toño': 'tˈQnjQ', 'Iván': 'iːvˈɑːn', 'Díaz': 'dˈiːas', 'Lía': 'lˈiːə', 'Ruiz': 'ɹuːˈiːs',
        'Puebla': 'pwˈɛblə', 'pizarrón': 'pɪsəɹˈQn', 'Aisha': 'ˈIʃə',
    },
}

# IPA (la de las páginas) → notación de misaki, para las demostraciones que
# solo tienen transcripción (/θriː/). Diptongos antes que vocales sueltas.
IPA_A_MISAKI = [('eɪ', 'A'), ('aɪ', 'I'), ('ɔɪ', 'Y'), ('aʊ', 'W'), ('oʊ', 'O'), ('əʊ', 'Q'), ('tʃ', 'ʧ'), ('dʒ', 'ʤ'),
                ('ɝ', 'ɜɹ'), ('ɚ', 'əɹ'), ('r', 'ɹ'), ('g', 'ɡ'), ('.', ''), (' ', '')]

ES = None  # palabras solo españolas (voces.json)

# Variantes elegidas por mejorar.py para los audios que Whisper marcó:
# {"<acento>|<rol>|<texto>": {"sufijo": ".", "velocidad": 0.95, "voz": "bf_isabella"}}.
# Así la regeneración reproduce exactamente el audio elegido. «voz» sustituye,
# solo en ese clip, a la voz del rol por otra del MISMO acento y género (el
# archivo sigue en la carpeta del rol, que es la que calcula el navegador; la
# voz real queda anotada en el manifiesto).
_VARIANTES_RUTA = Path(__file__).with_name('variantes.json')
VARIANTES = json.loads(_VARIANTES_RUTA.read_text(encoding='utf-8')) if _VARIANTES_RUTA.exists() else {}


def variante(texto_original, acento, rol):
    return VARIANTES.get(f'{acento}|{rol}|{texto_original}', {})
# /…/ de AFI: sin dígitos (así «7/4/2026» no es AFI) y pegado a sus barras.
IPA_RE = re.compile(r'(?<![\w/])/(?=[^\s/\d])[^/\n\d]+?(?<=\S)/(?![\w/])')


def es_espanol(t):
    limpio = re.sub(r'\([^)]*\)', ' ', IPA_RE.sub(' ', t))
    if re.search('[¿¡]', limpio):
        return True
    palabras = re.findall(r'[A-Za-zÀ-ÿ]+', limpio)
    if not palabras:
        return True
    # una letra mayúscula suelta (la «O» o la «Y» del alfabeto) no es español
    es = sum(1 for p in palabras if not re.fullmatch('[A-Z]', p) and p.lower() in ES or (re.fullmatch('[a-zà-ÿ]+', p) and re.search('[áéíóúñü]', p)))
    return es * 2 >= len(palabras)


_LEX = None


def es_palabra_inglesa(w):
    """¿Está en el diccionario inglés de misaki (o es una flexión regular de algo que lo está)?"""
    global _LEX
    if _LEX is None:
        from misaki import en
        _LEX = en.G2P(trf=False, british=False, fallback=None).lexicon
    for c in (w, w.lower(), w.capitalize()):
        if c in _LEX.golds or c in _LEX.silvers:
            return True
    for suf, rep_ in (('ies', 'y'), ('es', ''), ('s', ''), ('ed', ''), ('ed', 'e'), ('ing', ''), ('ing', 'e'), ("'s", '')):
        if w.lower().endswith(suf) and (w.lower()[: -len(suf)] + rep_) in _LEX.golds:
            return True
    return False


def tiene_espanol(t):
    """Criterio estricto para glosas (paréntesis, «= …», colas): una palabra basta."""
    return any(p.lower() in ES or (re.fullmatch('[a-zà-ÿ]+', p) and re.search('[áéíóúñü]', p))
               for p in re.findall(r'[A-Za-zÀ-ÿ]+', t)) or bool(re.search('[¿¡]', t))


def ipa_a_misaki(ipa, acento):
    s = ipa.strip('/').strip()
    for a, b in IPA_A_MISAKI:
        s = s.replace(a, b)
    if acento == 'us':
        s = s.replace('ː', '')
    return s


def texto_para_voz(t, acento):
    """(texto, fonemas): lo que realmente se sintetiza. fonemas != None → síntesis directa."""
    ipas = IPA_RE.findall(t)
    s = t.replace('«', '').replace('»', '').replace('“', '"').replace('”', '"')
    s = re.sub(r'\s*↗\s*$', '?', s)
    s = re.sub(r'\s*↘\s*$', '.', s)
    s = s.replace('↗', '').replace('↘', '')
    # aclaraciones entre paréntesis: fuera si son español; si no, sin paréntesis
    def parentesis(m):
        dentro = m.group(1).strip()
        # glosa española, solo cifras («thirteen (13)») o siglas («(R. U.)»): fuera
        # se lee solo si TODAS sus palabras son inglesas de diccionario
        if tiene_espanol(dentro) or not all(es_palabra_inglesa(w) for w in re.findall(r"[A-Za-zÀ-ÿ']+", dentro)) or re.fullmatch(r'[\d\s.,:/-]*', dentro) or re.fullmatch(r'([A-Z]{1,2}\.\s*)+', dentro):
            return ''
        return ', ' + dentro
    s = re.sub(r'\s*\(([^)]*)\)', parentesis, s)
    s = IPA_RE.sub(', ', s)
    # «x = y»: solo las partes inglesas
    if ' = ' in s or re.search(r'\S=\S', s) is None and '=' in s:
        partes = [p.strip(' ,.;') for p in re.split(r'\s*=\s*|;', s)]
        s = ', '.join(p for p in partes if p and re.search('[A-Za-z]', p) and not tiene_espanol(p))
    # colas en español tras una coma («…, con dientes sobre el labio»)
    trozos = [x for x in re.split(r',\s*', s)]
    # (solo si la cola es de verdad español: «, and the café is…» es inglés)
    while len(trozos) > 1 and re.search('[A-Za-z]', trozos[-1]) and tiene_espanol(trozos[-1]) and es_espanol(trozos[-1]):
        trozos.pop()
    s = ', '.join(trozos)
    # separadores visuales → pausa
    s = re.sub(r'\s+(?:/|·|→|≠|—|–|⏎)\s+', '. ', s)
    s = re.sub(r'[·→≠⏎]', ' ', s)
    s = re.sub(r'\s*,\s*(,\s*)+', ', ', s)
    s = re.sub(r'\s+([,.!?])', r'\1', s)
    s = re.sub(r'([.!?])[.,]+', r'\1', s)
    s = re.sub(r',\.', '.', s)
    s = re.sub(r'\s+', ' ', s).strip(' ,;')
    if not re.search('[A-Za-z]', s) or es_espanol(s):
        if ipas:
            return None, ' '.join(ipa_a_misaki(i, acento) for i in ipas)
        return None, None
    s = s.replace('ñ', 'enye') if re.search(r'\bletter ñ\b', t) else s
    for nombre, fon in LEXICO[acento].items():
        s = re.sub(rf"(?<![\w\[]){re.escape(nombre)}(?=\W|$)", f'[{nombre}](/{fon}/)', s)
    return s, None


# --------------------------------------------------------------- audio
medidor = pyln.Meter(SR)


def recortar(a, umbral=0.012, antes=0.06, despues=0.12):
    idx = np.where(np.abs(a) > umbral)[0]
    if not len(idx):
        return a
    i = max(0, idx[0] - int(antes * SR))
    f = min(len(a), idx[-1] + int(despues * SR))
    return a[i:f]


def normalizar_volumen(a):
    medir = a if len(a) >= SR * 0.5 else np.concatenate([a, np.zeros(int(SR * 0.5) - len(a) + 1)])
    lufs = medidor.integrated_loudness(medir)
    if np.isfinite(lufs):
        a = a * (10 ** ((LUFS - lufs) / 20))
    pico = np.max(np.abs(a)) if len(a) else 0
    if pico > PICO:
        a = a * (PICO / pico)   # solo ganancia: sin limitador, sin distorsión
    return a.astype(np.float32)


def a_mp3(a, destino):
    destino.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
        sf.write(tmp.name, a, SR, subtype='PCM_16')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp.name, '-ac', '1', '-ar', str(SR),
                        '-codec:a', 'libmp3lame', '-q:a', '5', '-map_metadata', '-1', str(destino)], check=True)


class Sintetizador:
    def __init__(self):
        from kokoro import KPipeline, KModel
        import torch
        dispositivo = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.modelo = KModel().to(dispositivo).eval()
        self.pipes = {'us': KPipeline(lang_code='a', model=self.modelo), 'gb': KPipeline(lang_code='b', model=self.modelo)}

    def __call__(self, texto, fonemas, acento, voz, sufijo='', velocidad=1.0):
        p = self.pipes[acento]
        if fonemas:
            trozos = [r.audio for r in p.generate_from_tokens(fonemas, voice=voz, speed=velocidad)]
        else:
            trozos = [r.audio for r in p(texto + sufijo, voice=voz, speed=velocidad) if r.audio is not None]
        if not trozos:
            raise RuntimeError('sin audio')
        return np.concatenate([np.asarray(t, dtype=np.float32) for t in trozos])


def main():
    global ES
    args = sys.argv[1:]
    acentos = ['us', 'gb'] if (not args or args[0] in ('todos', '--solo-pistas', '--limite')) else [args[0]]
    solo_pistas = '--solo-pistas' in args
    limite = int(args[args.index('--limite') + 1]) if '--limite' in args else None

    voces = json.loads((AUDIO / 'voces.json').read_text(encoding='utf-8'))
    ES = set(voces['espanol'])
    corpus = json.loads(CORPUS.read_text(encoding='utf-8'))
    manifiesto = json.loads(MANIFIESTO.read_text(encoding='utf-8')) if MANIFIESTO.exists() else {'clips': {}, 'pistas': {}}
    sint = Sintetizador()
    cache_wav = {}  # (acento, rol, texto) → audio normalizado, para montar pistas

    for acento in acentos:
        roles = voces['acentos'][acento]['roles']
        hechos = saltados = sin_voz = 0
        t0 = time.time()
        clips = corpus['clips'][:limite] if limite else corpus['clips']
        if solo_pistas:
            en_pistas = {(s['rol'], s['texto']) for p in corpus['pistas'] for s in p['segmentos']}
            clips = [c for c in clips if (c['rol'], c['texto']) in en_pistas]
        for n, c in enumerate(clips, 1):
            rel = c['rutas'][acento]
            destino = AUDIO / rel
            previo = manifiesto['clips'].get(rel)
            texto, fonemas = texto_para_voz(c['texto'], acento)
            var = variante(c['texto'], acento, c['rol'])
            sintetizado = (texto + var.get('sufijo', '') if texto is not None else ('/' + fonemas + '/' if fonemas else None))
            if var.get('velocidad', 1.0) != 1.0:
                sintetizado += f" @{var['velocidad']}"
            if var.get('voz'):
                sintetizado += f" #{var['voz']}"

            if (destino.exists() and previo and previo.get('config') == CONFIG_VERSION and previo.get('texto') == c['texto']
                    and previo.get('sintetizado') == sintetizado):
                saltados += 1
                continue
            if texto is None and fonemas is None:
                sin_voz += 1
                continue
            voz_real = var.get('voz', roles[c['rol']])
            a = normalizar_volumen(recortar(sint(texto, fonemas, acento, voz_real, var.get('sufijo', ''), var.get('velocidad', 1.0))))
            a_mp3(a, destino)
            manifiesto['clips'][rel] = {
                'texto': c['texto'], 'sintetizado': sintetizado,
                'acento': acento, 'rol': c['rol'], 'voz': voz_real, 'duracion': round(len(a) / SR, 3),
                'config': CONFIG_VERSION, 'bytes': destino.stat().st_size,
            }
            hechos += 1
            if n % 250 == 0:
                MANIFIESTO.write_text(json.dumps(manifiesto, ensure_ascii=False, indent=0), encoding='utf-8')
                print(f'  {acento}: {n}/{len(clips)} · {time.time() - t0:.0f} s', flush=True)
        MANIFIESTO.write_text(json.dumps(manifiesto, ensure_ascii=False, indent=0), encoding='utf-8')
        print(f'{acento}: {hechos} generados · {saltados} ya estaban · {sin_voz} sin texto inglés · {time.time() - t0:.0f} s', flush=True)

        # ------------------------------------------------ pistas completas
        for p in corpus['pistas']:
            base = AUDIO / p['tipo'] / acento / p['slug']
            partes, segmentos, t = [], [], 0.0
            anterior = None
            for i, s in enumerate(p['segmentos']):
                if i:
                    pausa = PAUSA_LINEA if p['tipo'] == 'escucha' else (PAUSA_PARRAFO if s.get('parrafo') != anterior else PAUSA_FRASE)
                    partes.append(np.zeros(int(pausa * SR), dtype=np.float32))
                    t += pausa
                texto, fonemas = texto_para_voz(s['texto'], acento)
                var = variante(s['texto'], acento, s['rol'])
                a = normalizar_volumen(recortar(sint(texto, fonemas, acento, var.get('voz', roles[s['rol']]), var.get('sufijo', ''), var.get('velocidad', 1.0))))
                partes.append(a)
                segmentos.append({**{k: v for k, v in s.items() if k != 'rol'}, 'inicio': round(t, 3), 'fin': round(t + len(a) / SR, 3)})
                t += len(a) / SR
                anterior = s.get('parrafo')
            pista = np.concatenate(partes)
            a_mp3(pista, base.with_suffix('.mp3'))
            meta = {'duracion': round(len(pista) / SR, 3), 'acento': acento, 'config': CONFIG_VERSION,
                    'nota': 'Tiempos exactos: la pista es la concatenación de los audios de cada segmento con pausas fijas.',
                    'segmentos': segmentos}
            base.with_suffix('.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding='utf-8')
            manifiesto['pistas'][f"{p['tipo']}/{acento}/{p['slug']}"] = {'duracion': meta['duracion'], 'segmentos': len(segmentos), 'config': CONFIG_VERSION}
        MANIFIESTO.write_text(json.dumps(manifiesto, ensure_ascii=False, indent=0), encoding='utf-8')
        print(f'{acento}: {len(corpus["pistas"])} pistas completas', flush=True)


if __name__ == '__main__':
    main()
