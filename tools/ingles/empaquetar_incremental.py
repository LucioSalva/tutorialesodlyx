"""
ZIP incremental respecto a lo que YA está instalado (herramienta de desarrollo).

Línea base = árbol del último commit de git + los ZIP incrementales ya
entregados que se indiquen (en orden), extraídos encima. Entra en el ZIP
todo archivo del proyecto que no exista en la base o cuyo contenido difiera,
salvo las exclusiones (herramientas, agentes, credenciales, temporales, ZIP,
PDF). No sobrescribe un ZIP existente.

  python3 tools/ingles/empaquetar_incremental.py <salida.zip> <zip_base_1> [<zip_base_2> …]
"""
import hashlib, os, re, subprocess, sys, zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
salida = RAIZ / sys.argv[1]
bases = [RAIZ / z for z in sys.argv[2:]]
if salida.exists():
    sys.exit(f'Ya existe {salida.name}: no se sobrescriben versiones.')

EXCLUIR = re.compile(r'^(tools/|\.claude/|\.agents/|\.git/|dist/)|(^|/)(config/config\.php|\.env[^/]*|skills-lock\.json)$'
                     r'|\.(zip|log|bak|orig|swp|tmp|pdf|pyc)$|~$|(^|/)__|(^|/)\.DS_Store$')

h = lambda b: hashlib.sha1(b).hexdigest()
base = {}
arbol = subprocess.run(['git', 'ls-tree', '-r', 'HEAD'], cwd=RAIZ, capture_output=True, text=True, check=True).stdout
for linea in arbol.splitlines():
    meta, ruta = linea.split('\t', 1)
    contenido = subprocess.run(['git', 'cat-file', 'blob', meta.split()[2]], cwd=RAIZ, capture_output=True, check=True).stdout
    base[ruta] = h(contenido)
for z in bases:
    with zipfile.ZipFile(z) as zz:
        for n in zz.namelist():
            if not n.endswith('/'):
                base[n] = h(zz.read(n))

cambios = []
for ruta in sorted(RAIZ.rglob('*')):
    if not ruta.is_file():
        continue
    rel = ruta.relative_to(RAIZ).as_posix()
    if EXCLUIR.search(rel):
        continue
    if base.get(rel) != h(ruta.read_bytes()):
        cambios.append(rel)

with zipfile.ZipFile(salida, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zz:
    for rel in cambios:
        # MP3 ya comprimido: se guarda sin recomprimir (más rápido, mismo tamaño)
        tipo = zipfile.ZIP_STORED if rel.endswith('.mp3') else zipfile.ZIP_DEFLATED
        zz.write(RAIZ / rel, rel, compress_type=tipo)
nuevos = sum(1 for r in cambios if r not in base)
print(f'{salida.name}: {len(cambios)} archivos ({nuevos} nuevos, {len(cambios) - nuevos} modificados) · {salida.stat().st_size / 1e6:.1f} MB')
