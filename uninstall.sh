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

# UI Configuration
UI_DIR="/opt/${APP_NAME}-ui"
UI_SERVICE_NAME="${APP_NAME}-ui"
UI_SERVICE_FILE="/etc/systemd/system/${UI_SERVICE_NAME}.service"

# Nginx / hostname
NGINX_SITE_AVAILABLE="/etc/nginx/sites-available/${APP_NAME}"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/${APP_NAME}"

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

# === Stop Backend Service ===
if systemctl is-active --quiet "${APP_NAME}.service"; then
    log_info "Stopping ${APP_NAME} service..."
    systemctl stop "${APP_NAME}.service" || true
fi

if systemctl is-enabled --quiet "${APP_NAME}.service"; then
    log_info "Disabling ${APP_NAME} service..."
    systemctl disable "${APP_NAME}.service" || true
fi

if [[ -f "$SERVICE_FILE" ]]; then
    log_info "Removing backend systemd service file..."
    rm -f "$SERVICE_FILE"
    log_ok "Backend service removed"
fi

# === Stop UI Service ===
if systemctl is-active --quiet "${UI_SERVICE_NAME}.service"; then
    log_info "Stopping ${UI_SERVICE_NAME} service..."
    systemctl stop "${UI_SERVICE_NAME}.service" || true
fi

if systemctl is-enabled --quiet "${UI_SERVICE_NAME}.service"; then
    log_info "Disabling ${UI_SERVICE_NAME} service..."
    systemctl disable "${UI_SERVICE_NAME}.service" || true
fi

if [[ -f "$UI_SERVICE_FILE" ]]; then
    log_info "Removing UI systemd service file..."
    rm -f "$UI_SERVICE_FILE"
    log_ok "UI service removed"
fi

systemctl daemon-reload

# === Remove Nginx Config ===
if [[ -f "$NGINX_SITE_ENABLED" ]]; then
    log_info "Removing nginx site config..."
    rm -f "$NGINX_SITE_ENABLED"
    rm -f "$NGINX_SITE_AVAILABLE"
    # Restore default site if nginx is installed
    if command -v nginx &> /dev/null; then
        ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default 2>/dev/null || true
        nginx -t > /dev/null 2>&1 && systemctl reload nginx 2>/dev/null || true
    fi
    log_ok "Nginx config removed"
else
    log_warn "No nginx site config found. Skipping."
fi

# === Remove Backend Files ===
if [[ -d "$APP_DIR" ]]; then
    log_info "Removing backend directory ${APP_DIR}..."
    rm -rf "$APP_DIR"
    log_ok "Backend files removed"
else
    log_warn "Backend directory not found. Skipping."
fi

# === Remove UI Files ===
if [[ -d "$UI_DIR" ]]; then
    log_info "Removing UI directory ${UI_DIR}..."
    rm -rf "$UI_DIR"
    log_ok "UI files removed"
else
    log_warn "UI directory not found. Skipping."
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
