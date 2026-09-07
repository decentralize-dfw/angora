#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
: "${ANGORA_BLENDER_DIR:?Set ANGORA_BLENDER_DIR to the portable Blender directory}"
export LD_LIBRARY_PATH="${ANGORA_BLENDER_DIR}/lib${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"
export BLENDER_SYSTEM_RESOURCES="${ANGORA_BLENDER_DIR}/4.5"
exec "${ANGORA_BLENDER_DIR}/blender" --background --threads 4 --python-exit-code 1 "$@"
