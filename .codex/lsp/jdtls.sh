#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONFIG_DIR="${WORKSPACE_DIR}/.jdtls/configuration"
DATA_DIR="${WORKSPACE_DIR}/.jdt"

mkdir -p "${CONFIG_DIR}" "${DATA_DIR}"

exec /opt/homebrew/bin/jdtls \
  -configuration "${CONFIG_DIR}" \
  "$@"
