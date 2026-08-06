#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
VALHALLA_DIR="$(CDPATH= cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${VALHALLA_DIR}/.env"
ENV_EXAMPLE_FILE="${VALHALLA_DIR}/.env.example"

error() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

info() {
  printf '%s\n' "$*"
}

load_env() {
  if [ -f "${ENV_FILE}" ]; then
    set -a
    # shellcheck disable=SC1090
    . "${ENV_FILE}"
    set +a
  elif [ -f "${ENV_EXAMPLE_FILE}" ]; then
    info "No .env file found; using .env.example defaults for validation."
    set -a
    # shellcheck disable=SC1090
    . "${ENV_EXAMPLE_FILE}"
    set +a
  else
    error "Missing ${ENV_EXAMPLE_FILE}."
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || error "Required command '$1' is unavailable."
}

require_docker() {
  require_command docker
  docker info >/dev/null 2>&1 || error "Docker is unavailable or Docker Engine is not running."
  docker compose version >/dev/null 2>&1 || error "Docker Compose is unavailable."
}

require_env() {
  value="$(eval "printf '%s' \"\${$1:-}\"")"
  [ -n "${value}" ] || error "Required environment variable ${1} is missing. Configure ${ENV_FILE}."
}

resolve_path() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s/%s\n' "${VALHALLA_DIR}" "$1" ;;
  esac
}

require_directory() {
  path="$(resolve_path "$1")"
  [ -d "${path}" ] || error "Required directory is missing: ${path}"
}

require_osm_file() {
  require_env VALHALLA_OSM_DIR
  require_env VALHALLA_OSM_FILENAME
  osm_path="$(resolve_path "${VALHALLA_OSM_DIR}")/${VALHALLA_OSM_FILENAME}"
  [ -f "${osm_path}" ] || error "OSM extract is missing: ${osm_path}"
}

require_port_available() {
  require_env VALHALLA_API_PORT
  if command -v lsof >/dev/null 2>&1; then
    if lsof -nP -iTCP:"${VALHALLA_API_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
      error "Port ${VALHALLA_API_PORT} is already occupied. Stop the process or choose another VALHALLA_API_PORT."
    fi
  else
    info "lsof is unavailable; skipping port availability check."
  fi
}

require_image_manifest() {
  require_env VALHALLA_IMAGE
  require_env VALHALLA_PLATFORM
  info "Checking image manifest for ${VALHALLA_IMAGE} (${VALHALLA_PLATFORM}) without pulling..."
  manifest="$(docker buildx imagetools inspect "${VALHALLA_IMAGE}" 2>/dev/null || true)"
  [ -n "${manifest}" ] || error "Image manifest is unavailable for ${VALHALLA_IMAGE}. Check the image name, registry access, or network."
  printf '%s\n' "${manifest}" | grep -q "${VALHALLA_PLATFORM}" || error "Image ${VALHALLA_IMAGE} does not advertise ${VALHALLA_PLATFORM} in its manifest."
}

validate_common() {
  load_env
  require_docker
  require_env VALHALLA_IMAGE
  require_env VALHALLA_PLATFORM
  require_env VALHALLA_API_PORT
  require_env VALHALLA_OSM_FILENAME
  require_env VALHALLA_OSM_DIR
  require_env VALHALLA_TILE_DIR
  require_env VALHALLA_CONFIG_DIR
  require_env VALHALLA_LOG_DIR
  require_directory "${VALHALLA_OSM_DIR}"
  require_directory "${VALHALLA_TILE_DIR}"
  require_directory "${VALHALLA_CONFIG_DIR}"
  require_directory "${VALHALLA_LOG_DIR}"
}
