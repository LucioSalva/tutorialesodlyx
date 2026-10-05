#!/usr/bin/env bash
# =====================================================================
#  Academia de Inglés · ZIP incremental para HostGator (desarrollo)
#
#    bash tools/ingles/empaquetar.sh 1.6.0
#
#  Incluye SOLO archivos nuevos o modificados respecto al último commit
#  (git), con sus rutas relativas, listos para extraer sobre la instalación
#  existente. Excluye herramientas, borradores, agentes, credenciales,
#  logs, temporales, copias y ZIP anteriores. Nunca incluye PDFs.
# =====================================================================
set -euo pipefail

VERSION="${1:?Uso: empaquetar.sh X.Y.Z}"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Versión no válida: $VERSION" >&2; exit 1; }
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RAIZ"
ZIP="tutoriales-academia-ingles-v${VERSION}-hostgator.zip"
[[ -e "$ZIP" ]] && { echo "Ya existe $ZIP: no se sobrescriben versiones." >&2; exit 1; }

# Nuevos + modificados (sin borrados), respecto a HEAD.
mapfile -t ARCHIVOS < <(
  { git diff --name-only --diff-filter=AMR HEAD; git ls-files --others --exclude-standard; } | sort -u |
  grep -Ev '^(tools/|\.claude/|\.agents/|dist/)' |
  grep -Ev '(^|/)(config/config\.php|\.env[^/]*|skills-lock\.json)$' |
  grep -Ev '\.(zip|log|bak|orig|swp|tmp|pdf)$|~$|(^|/)__' || true
)
[[ ${#ARCHIVOS[@]} -gt 0 ]] || { echo "No hay archivos que empaquetar." >&2; exit 1; }

zip -q -X "$ZIP" -- "${ARCHIVOS[@]}"
echo "$ZIP · ${#ARCHIVOS[@]} archivos · $(du -h "$ZIP" | cut -f1)"
