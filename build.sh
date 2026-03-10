#!/usr/bin/env bash
# ============================================================
#  FLOW Normalizer – Build-Skript (Cross-Compile von Linux/macOS)
# ============================================================
#
#  Voraussetzungen:
#    - .NET 8 SDK installiert
#
#  Nutzung:
#    ./build.sh              Kompiliert Debug-Build (Windows-EXE)
#    ./build.sh release      Kompiliert Release-Build
#    ./build.sh publish      Erstellt eigenstaendige EXE (Single-File)
#
# ============================================================

set -euo pipefail

CONFIG="Debug"
ACTION="build"

case "${1:-}" in
  release) CONFIG="Release" ;;
  publish) ACTION="publish" ;;
esac

if [ "$ACTION" = "publish" ]; then
  echo "[FLOW] Publishing self-contained Single-File EXE ..."
  dotnet publish FlowNormalizer.csproj -c Release -r win-x64 --self-contained true \
    -p:PublishSingleFile=true -o publish
  echo "[FLOW] Fertig! Ausgabe in: publish/"
  ls publish/
else
  echo "[FLOW] Building $CONFIG ..."
  dotnet build FlowNormalizer.csproj -c "$CONFIG"
  echo "[FLOW] Build erfolgreich."
fi
