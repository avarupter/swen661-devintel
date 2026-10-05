#!/usr/bin/env bash
# Builds the Windows NSIS installer (dist/CareConnect-Setup-<version>.exe) from
# Linux or WSL, using electron-builder's Wine image.
#
#   npm run dist:win:docker
#
# The main/preload/renderer bundles are built on the host first (npm run build),
# so the container only packages them. There are no native modules, so the
# host's node_modules can be reused as-is. On a Windows machine with Node
# installed, `npm run dist:win` does the same thing without Docker.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f out/main/index.js ]; then
  echo "out/ is missing; run 'npm run build' first (or use 'npm run dist:win:docker')." >&2
  exit 1
fi

mkdir -p "${HOME}/.cache/electron" "${HOME}/.cache/electron-builder"

docker run --rm \
  -e HOST_UID="$(id -u)" \
  -e HOST_GID="$(id -g)" \
  -e ELECTRON_CACHE=/root/.cache/electron \
  -e ELECTRON_BUILDER_CACHE=/root/.cache/electron-builder \
  -v "${PWD}":/project \
  -v "${HOME}/.cache/electron":/root/.cache/electron \
  -v "${HOME}/.cache/electron-builder":/root/.cache/electron-builder \
  -w /project \
  electronuserland/builder:wine \
  /bin/bash -c '
    status=0
    npx electron-builder --win --x64 --publish never || status=$?
    # Hand everything the container wrote back to the host user.
    chown -R "$HOST_UID:$HOST_GID" /project/dist /root/.cache/electron /root/.cache/electron-builder 2>/dev/null || true
    exit $status
  '

echo
ls -lh dist/*.exe
