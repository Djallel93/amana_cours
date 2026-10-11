#!/bin/sh
# Lance un petit serveur local pour consulter les cours (index.html) sans erreur
# de chargement des pages. Aucun Python requis.
# Usage :  sh serve.sh [port]     (port par défaut : 8000)
# Puis ouvrir http://localhost:8000/ dans le navigateur. Arrêt : Ctrl+C.

cd "$(dirname "$0")" || exit 1
PORT="${1:-8000}"
URL="http://localhost:$PORT/"

echo "Cours AMANA : $URL   (Ctrl+C pour arrêter)"

if command -v php >/dev/null 2>&1; then
  exec php -S "localhost:$PORT" -t .
elif command -v busybox >/dev/null 2>&1 && busybox httpd --help >/dev/null 2>&1; then
  exec busybox httpd -f -p "$PORT" -h .
elif command -v npx >/dev/null 2>&1; then
  exec npx --yes http-server . -p "$PORT"
elif command -v ruby >/dev/null 2>&1; then
  exec ruby -run -e httpd . -p "$PORT"
else
  echo "Aucun serveur disponible (php, busybox, node ou ruby)." >&2
  echo "Installez par exemple PHP, ou ouvrez index.html directement depuis un chemin réel (file:///home/...)." >&2
  exit 1
fi
