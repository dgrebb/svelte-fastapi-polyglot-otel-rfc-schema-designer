#!/usr/bin/env bash
# Bootstrap local development for svelte-fastapi-remote-functions.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PYTHON_MIN_MAJOR=3
PYTHON_MIN_MINOR=11

info() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
ok() { printf '    \033[0;32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[0;33m!\033[0m %s\n' "$*" >&2; }
die() { printf '\n\033[0;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

prompt_yn() {
	local message="$1"
	local default="${2:-n}"
	local hint="y/N"
	[[ "$default" == "y" ]] && hint="Y/n"
	printf '%s [%s] ' "$message" "$hint"
	read -r reply
	reply="${reply:-$default}"
	case "$reply" in
		[yY] | [yY][eE][sS]) return 0 ;;
		*) return 1 ;;
	esac
}

detect_os() {
	case "$(uname -s)" in
		Darwin) echo "macos" ;;
		Linux)
			if grep -qi microsoft /proc/version 2>/dev/null; then
				echo "wsl"
			else
				echo "linux"
			fi
			;;
		MINGW* | MSYS* | CYGWIN*) echo "windows" ;;
		*) echo "unknown" ;;
	esac
}

has_cmd() { command -v "$1" >/dev/null 2>&1; }

try_brew() {
	has_cmd brew && brew install "$@"
}

try_apt() {
	has_cmd apt-get && sudo apt-get update && sudo apt-get install -y "$@"
}

python_ok() {
	has_cmd python3 && python3 -c "import sys; raise SystemExit(0 if sys.version_info >= (${PYTHON_MIN_MAJOR}, ${PYTHON_MIN_MINOR}) else 1)"
}

ensure_node() {
	info "Node.js (for ui/)"
	if has_cmd node; then
		ok "node $(node --version)"
		return 0
	fi

	warn "Node.js not found. ui/ needs Node 20+ (24 recommended for Docker parity)."
	local os
	os="$(detect_os)"
	case "$os" in
		macos)
			warn "Install: brew install node   — or https://nodejs.org/"
			prompt_yn "Try: brew install node?" && try_brew node
			;;
		linux | wsl)
			warn "Install: https://nodejs.org/ or your distro Node 20+ package"
			prompt_yn "Try: sudo apt-get install -y nodejs npm (Debian/Ubuntu)?" && try_apt nodejs npm
			;;
		windows)
			warn "Install: winget install OpenJS.NodeJS.LTS  or  choco install nodejs-lts"
			;;
		*)
			warn "Install Node from https://nodejs.org/"
			;;
	esac

	has_cmd node || die "Node.js is required. Install it, then re-run: make setup"
	ok "node $(node --version)"
}

ensure_pnpm() {
	info "pnpm (ui package manager)"
	if has_cmd pnpm; then
		ok "pnpm $(pnpm --version)"
		return 0
	fi

	if has_cmd corepack; then
		info "Enabling pnpm via corepack"
		corepack enable
		corepack prepare pnpm@latest --activate
	fi

	if has_cmd pnpm; then
		ok "pnpm $(pnpm --version)"
		return 0
	fi

	local os
	os="$(detect_os)"
	case "$os" in
		macos)
			warn "Install: brew install pnpm   — or enable via corepack (bundled with Node)"
			prompt_yn "Try: brew install pnpm?" && try_brew pnpm
			;;
		linux | wsl)
			warn "Install: npm install -g pnpm   or enable corepack"
			if has_cmd npm && prompt_yn "Try: npm install -g pnpm?"; then
				npm install -g pnpm
			fi
			;;
		windows)
			warn "Install: winget install pnpm.pnpm  or  npm install -g pnpm"
			;;
	esac

	has_cmd pnpm || die "pnpm is required. Install it, then re-run: make setup"
	ok "pnpm $(pnpm --version)"
}

ensure_python() {
	info "Python ${PYTHON_MIN_MAJOR}.${PYTHON_MIN_MINOR}+ (api/)"
	if python_ok; then
		ok "python3 $(python3 --version 2>&1 | cut -d' ' -f2)"
		return 0
	fi

	local version="unknown"
	has_cmd python3 && version="$(python3 --version 2>&1 || true)"

	warn "Found: ${version:-none}. api/ requires Python ${PYTHON_MIN_MAJOR}.${PYTHON_MIN_MINOR}+."
	local os
	os="$(detect_os)"
	case "$os" in
		macos)
			warn "Upgrade: brew install python@3.12   (or python@3.13)"
			prompt_yn "Try: brew install python@3.12?" && try_brew python@3.12
			;;
		linux | wsl)
			warn "Upgrade: sudo apt install python3.12 python3.12-venv   (or your distro equivalent)"
			prompt_yn "Try: sudo apt-get install -y python3.12 python3.12-venv?" &&
				try_apt python3.12 python3.12-venv
			;;
		windows)
			warn "Upgrade: winget install Python.Python.3.12  or  choco install python"
			;;
	esac

	if python_ok; then
		ok "python3 $(python3 --version 2>&1 | cut -d' ' -f2)"
		return 0
	fi

	warn "Python ${PYTHON_MIN_MAJOR}.${PYTHON_MIN_MINOR}+ still not satisfied."
	prompt_yn "Continue setup anyway? (api install may fail)" || die "Install Python ${PYTHON_MIN_MAJOR}.${PYTHON_MIN_MINOR}+, then re-run: make setup"
}

ensure_docker() {
	info "Docker (make dev / make up)"
	if has_cmd docker && docker info >/dev/null 2>&1; then
		ok "docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
		if docker compose version >/dev/null 2>&1; then
			ok "docker compose $(docker compose version --short 2>/dev/null || docker compose version)"
		fi
		return 0
	fi

	if has_cmd docker; then
		warn "Docker CLI found but daemon is not running (start Docker Desktop or the docker service)."
	else
		local os
		os="$(detect_os)"
		case "$os" in
			macos)
				warn "Install: brew install --cask docker   — or Docker Desktop from docker.com"
				prompt_yn "Try: brew install --cask docker?" && try_brew --cask docker
				;;
			linux | wsl)
				warn "Install: https://docs.docker.com/engine/install/"
				;;
			windows)
				warn "Install: Docker Desktop — winget install Docker.DockerDesktop"
				;;
		esac
	fi

	if has_cmd docker && docker info >/dev/null 2>&1; then
		ok "docker is running"
		return 0
	fi

	warn "Docker is optional for local api/ui dev outside containers, but required for make dev / make up."
	prompt_yn "Continue without Docker?" || die "Install and start Docker, then re-run: make setup"
}

install_api() {
	info "API virtualenv and dependencies"
	"${MAKE:-make}" -C api install
	ok "api/.venv ready"
}

install_ui() {
	info "UI dependencies (pnpm)"
	(
		cd ui
		pnpm install --frozen-lockfile
	)
	ok "ui/node_modules ready"
}

install_playwright() {
	info "Playwright browsers (ui e2e)"
	(
		cd ui
		pnpm exec playwright install
	)
	ok "playwright browsers installed"
}

install_git_hooks() {
	info "Git hooks (Commitizen commit-msg)"
	"${MAKE:-make}" install-hooks
	ok "core.hooksPath → .githooks"
}

print_next_steps() {
	cat <<EOF

\033[0;32mSetup complete.\033[0m

  make dev          # docker compose dev (api :8000, ui :5173)
  make up           # docker compose production (:8000, :3000)
  cd api && make test
  cd ui && pnpm check

EOF
}

main() {
	printf '\n\033[1m=== svelte-fastapi-remote-functions setup ===\033[0m\n'
	ensure_node
	ensure_pnpm
	ensure_python
	ensure_docker
	install_api
	install_ui
	install_playwright
	install_git_hooks
	print_next_steps
}

main "$@"
