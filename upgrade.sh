#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
#  House Expense Tracker — Automatic Upgrader
#  For systems where install.sh was already run. Run with: sudo bash upgrade.sh
# ============================================================================

# === Configuration ===
APP_NAME="house-expense-tracker"
APP_DIR="/opt/${APP_NAME}"
APP_USER="housetracker"
LOG_FILE="/var/log/${APP_NAME}-upgrade.log"
GITHUB_ZIP="https://github.com/emung/house-expense-tracker-backend/archive/refs/heads/main.zip"
BACKUP_DIR="/tmp/${APP_NAME}-upgrade-backup"

# === Logging ===
log_info()  { echo -e "\e[34m⏳ $1\e[0m"; echo "[INFO]  $(date '+%H:%M:%S') $1" >> "$LOG_FILE"; }
log_ok()    { echo -e "\e[32m✅ $1\e[0m"; echo "[OK]    $(date '+%H:%M:%S') $1" >> "$LOG_FILE"; }
log_error() { echo -e "\e[31m❌ $1\e[0m"; echo "[ERROR] $(date '+%H:%M:%S') $1" >> "$LOG_FILE"; }
log_warn()  { echo -e "\e[33m⚠️  $1\e[0m"; echo "[WARN]  $(date '+%H:%M:%S') $1" >> "$LOG_FILE"; }

die() {
    log_error "$1"
    echo ""
    echo "Check the log for details: $LOG_FILE"
    exit 1
}

# === Pre-flight Checks ===
preflight_checks() {
    # Must be root
    if [[ $EUID -ne 0 ]]; then
        echo ""
        echo "This upgrader must be run with sudo."
        echo "Usage: sudo bash upgrade.sh"
        echo ""
        exit 1
    fi

    # App must be installed
    if [[ ! -d "$APP_DIR" ]]; then
        die "The app is not installed at $APP_DIR. Run install.sh first."
    fi

    # .env must exist (contains secrets we need to preserve)
    if [[ ! -f "${APP_DIR}/.env" ]]; then
        die "No .env file found at ${APP_DIR}/.env. The installation may be corrupt."
    fi

    # Internet check
    if ! curl -s --max-time 5 https://github.com > /dev/null 2>&1; then
        die "No internet connection. Please connect to the internet and try again."
    fi

    # Init log
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "=== Upgrade started at $(date) ===" > "$LOG_FILE"
    log_ok "Pre-flight checks passed"
}

# === Backup Config ===
backup_config() {
    log_info "Backing up configuration..."
    rm -rf "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"

    # Backup .env (contains DB password, JWT keys, all secrets)
    cp "${APP_DIR}/.env" "${BACKUP_DIR}/.env" \
        || die "Failed to backup .env file."

    # Backup JWT key files if they exist
    if [[ -d "${APP_DIR}/local" ]]; then
        cp -r "${APP_DIR}/local" "${BACKUP_DIR}/local" \
            || die "Failed to backup JWT keys."
    fi

    log_ok "Configuration backed up to ${BACKUP_DIR}"
}

# === Stop Service ===
stop_service() {
    log_info "Stopping ${APP_NAME} service..."
    if systemctl is-active --quiet "${APP_NAME}.service"; then
        systemctl stop "${APP_NAME}.service" >> "$LOG_FILE" 2>&1 \
            || die "Failed to stop the service."
        log_ok "Service stopped"
    else
        log_warn "Service was not running."
    fi
}

# === Download & Replace ===
download_and_replace() {
    log_info "Downloading latest version from GitHub..."
    local tmp_zip="/tmp/${APP_NAME}.zip"

    curl -fsSL "$GITHUB_ZIP" -o "$tmp_zip" >> "$LOG_FILE" 2>&1 \
        || die "Failed to download application from GitHub."

    log_info "Extracting new version..."
    rm -rf /tmp/house-expense-tracker-backend-main
    unzip -qo "$tmp_zip" -d /tmp >> "$LOG_FILE" 2>&1 \
        || die "Failed to extract application archive."

    log_info "Replacing application files..."
    rm -rf "$APP_DIR"
    mv /tmp/house-expense-tracker-backend-main "$APP_DIR" \
        || die "Failed to move new application to ${APP_DIR}."

    rm -f "$tmp_zip"
    log_ok "Application files updated"
}

# === Restore Config ===
restore_config() {
    log_info "Restoring configuration..."

    # Restore .env
    cp "${BACKUP_DIR}/.env" "${APP_DIR}/.env" \
        || die "Failed to restore .env file."
    chmod 600 "${APP_DIR}/.env"

    # Restore JWT keys
    if [[ -d "${BACKUP_DIR}/local" ]]; then
        cp -r "${BACKUP_DIR}/local" "${APP_DIR}/local" \
            || die "Failed to restore JWT keys."
    fi

    # Cleanup backup
    rm -rf "$BACKUP_DIR"
    log_ok "Configuration restored"
}

# === Build App ===
build_app() {
    log_info "Installing npm dependencies (this may take a few minutes)..."
    cd "$APP_DIR"
    npm install --production=false --legacy-peer-deps >> "$LOG_FILE" 2>&1 \
        || die "Failed to install npm dependencies."

    npm install express --legacy-peer-deps >> "$LOG_FILE" 2>&1 \
        || die "Failed to install express."

    log_ok "npm dependencies installed"

    log_info "Building application..."
    npm run build >> "$LOG_FILE" 2>&1 \
        || die "Failed to build application."
    log_ok "Application built"

    log_info "Running database migrations..."
    npm run migration:run >> "$LOG_FILE" 2>&1 \
        || die "Failed to run database migrations."
    log_ok "Database migrations complete"
}

# === Fix Ownership & Restart ===
start_service() {
    log_info "Setting file permissions..."
    chown -R "${APP_USER}:${APP_USER}" "$APP_DIR"
    log_ok "Permissions set"

    log_info "Starting ${APP_NAME} service..."
    systemctl start "${APP_NAME}.service" >> "$LOG_FILE" 2>&1 \
        || die "Failed to start the service."
    log_ok "Service started"
}

# === Banners ===
print_banner() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║          House Expense Tracker — Upgrader                   ║"
    echo "║                                                            ║"
    echo "║  This will upgrade the app to the latest version.          ║"
    echo "║  Your data and configuration will be preserved.            ║"
    echo "║  Estimated time: 3–5 minutes.                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

print_success() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  ✅  Upgrade Complete!                                      ║"
    echo "║                                                            ║"
    echo "║  The app is running at:  http://localhost:3000              ║"
    echo "║                                                            ║"
    echo "║  Useful commands:                                          ║"
    echo "║    sudo systemctl status  ${APP_NAME}                ║"
    echo "║    sudo systemctl restart ${APP_NAME}                ║"
    echo "║                                                            ║"
    echo "║  Upgrade log: ${LOG_FILE}   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

# === Main ===
main() {
    print_banner
    preflight_checks
    backup_config
    stop_service
    download_and_replace
    restore_config
    build_app
    start_service
    print_success
}

main "$@"
