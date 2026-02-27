#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
#  House Expense Tracker — Automatic Uninstaller
#  Run with: sudo bash uninstall.sh
# ============================================================================

# === Configuration ===
APP_NAME="house-expense-tracker"
APP_DIR="/opt/${APP_NAME}"
APP_USER="housetracker"
DB_NAME="house_expenses"
DB_USER="house_app"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
LOG_FILE="/var/log/${APP_NAME}-install.log"

# === Logging ===
log_info()  { echo -e "\e[34m⏳ $1\e[0m"; }
log_ok()    { echo -e "\e[32m✅ $1\e[0m"; }
log_error() { echo -e "\e[31m❌ $1\e[0m"; }
log_warn()  { echo -e "\e[33m⚠️  $1\e[0m"; }

# === Pre-flight Checks ===
if [[ $EUID -ne 0 ]]; then
    echo "This uninstaller must be run with sudo."
    echo "Usage: sudo bash uninstall.sh"
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          House Expense Tracker — Uninstaller               ║"
echo "║                                                            ║"
echo "║  This will COMPLETELY REMOVE the application, data,        ║"
echo "║  and database. This action CANNOT BE UNDONE.               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

# === Stop Service ===
if systemctl is-active --quiet "${APP_NAME}.service"; then
    log_info "Stopping ${APP_NAME} service..."
    systemctl stop "${APP_NAME}.service" || true
fi

if systemctl is-enabled --quiet "${APP_NAME}.service"; then
    log_info "Disabling ${APP_NAME} service..."
    systemctl disable "${APP_NAME}.service" || true
fi

if [[ -f "$SERVICE_FILE" ]]; then
    log_info "Removing systemd service file..."
    rm -f "$SERVICE_FILE"
    systemctl daemon-reload
    log_ok "Service removed"
fi

# === Remove Files ===
if [[ -d "$APP_DIR" ]]; then
    log_info "Removing application directory ${APP_DIR}..."
    rm -rf "$APP_DIR"
    log_ok "Files removed"
else
    log_warn "Application directory not found. Skipping."
fi

# === Remove Database ===
log_info "Removing PostgreSQL database and user..."
if command -v psql &> /dev/null; then
    # Drop database
    if sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
        sudo -u postgres psql -c "DROP DATABASE ${DB_NAME};" >> /dev/null 2>&1 || log_error "Failed to drop database ${DB_NAME}"
        log_ok "Database '${DB_NAME}' dropped"
    else
        log_warn "Database '${DB_NAME}' not found."
    fi

    # Drop user
    if sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
        sudo -u postgres psql -c "DROP USER ${DB_USER};" >> /dev/null 2>&1 || log_error "Failed to drop user ${DB_USER}"
        log_ok "Database user '${DB_USER}' dropped"
    else
        log_warn "Database user '${DB_USER}' not found."
    fi
else
    log_warn "PostgreSQL not found or psql not in PATH. Skipping database removal."
fi

# === Remove System User ===
if id "$APP_USER" &>/dev/null; then
    log_info "Removing system user '${APP_USER}'..."
    userdel "$APP_USER" || log_error "Failed to remove user ${APP_USER}"
    log_ok "System user removed"
else
    log_warn "System user '${APP_USER}' not found."
fi

# === Cleanup Logs ===
read -p "Do you want to remove the installation log at ${LOG_FILE}? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$LOG_FILE"
    log_ok "Logs removed"
fi

echo ""
log_ok "Uninstallation Complete!"
echo ""
