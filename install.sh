#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
#  House Expense Tracker — Automatic Installer
#  For fresh Linux Mint systems. Run with: sudo bash install.sh
# ============================================================================

# === Configuration ===
APP_NAME="house-expense-tracker"
APP_DIR="/opt/${APP_NAME}"
APP_PORT=3000
APP_USER="housetracker"
DB_NAME="house_expenses"
DB_USER="house_app"
DB_PASS=""  # generated at runtime
LOG_FILE="/var/log/${APP_NAME}-install.log"
GITHUB_ZIP="https://github.com/emung/house-expense-tracker-backend/archive/refs/heads/main.zip"
NODE_MAJOR=20
ADMIN_PASSWORD="admin"

# JWT key variables (populated during install)
JWT_PRIVATE=""
JWT_PUBLIC=""

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
        echo "This installer must be run with sudo."
        echo "Usage: sudo bash install.sh"
        echo ""
        exit 1
    fi

    # Already installed?
    if [[ -d "$APP_DIR" ]]; then
        die "The app is already installed at $APP_DIR. Remove it first if you want to reinstall."
    fi

    # Internet check
    if ! curl -s --max-time 5 https://github.com > /dev/null 2>&1; then
        die "No internet connection. Please connect to the internet and try again."
    fi

    # Init log
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "=== Installation started at $(date) ===" > "$LOG_FILE"
    log_ok "Pre-flight checks passed"
}

# === System Dependencies ===
install_system_deps() {
    log_info "Updating system packages (this may take a minute)..."
    apt-get update >> "$LOG_FILE" 2>&1 \
        || die "Failed to update package list. Check your internet connection."
    apt-get upgrade -y >> "$LOG_FILE" 2>&1 \
        || die "Failed to upgrade system packages."
    log_ok "System packages updated"

    log_info "Installing base dependencies (curl, unzip, openssl, build-essential)..."
    apt-get install -y curl unzip openssl build-essential ca-certificates gnupg >> "$LOG_FILE" 2>&1 \
        || die "Failed to install base dependencies."
    log_ok "Base dependencies installed"
}

# === Node.js ===
install_nodejs() {
    if command -v node &> /dev/null; then
        local current_version
        current_version=$(node --version)
        log_warn "Node.js is already installed: ${current_version}. Skipping."
        return
    fi

    log_info "Installing Node.js ${NODE_MAJOR}..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg >> "$LOG_FILE" 2>&1 \
        || die "Failed to add NodeSource GPG key."

    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list

    apt-get update >> "$LOG_FILE" 2>&1 \
        || die "Failed to update package list after adding NodeSource."
    apt-get install -y nodejs >> "$LOG_FILE" 2>&1 \
        || die "Failed to install Node.js."
    log_ok "Node.js $(node --version) installed"
}

# === PostgreSQL ===
install_postgresql() {
    log_info "Installing PostgreSQL..."
    apt-get install -y postgresql postgresql-contrib >> "$LOG_FILE" 2>&1 \
        || die "Failed to install PostgreSQL."
    systemctl enable postgresql >> "$LOG_FILE" 2>&1
    systemctl start postgresql >> "$LOG_FILE" 2>&1
    log_ok "PostgreSQL installed and running"
}

configure_database() {
    log_info "Configuring database..."
    DB_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 32)

    # Create or update db user
    if sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
        log_warn "Database user '${DB_USER}' already exists. Updating password."
        (sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';") >> "$LOG_FILE" 2>&1 \
            || die "Failed to update database user password."
    else
        (sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';") >> "$LOG_FILE" 2>&1 \
            || die "Failed to create database user."
    fi

    # Create database if not exists
    if sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
        log_warn "Database '${DB_NAME}' already exists. Skipping creation."
    else
        (sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};") >> "$LOG_FILE" 2>&1 \
            || die "Failed to create database."
    fi

    log_ok "Database '${DB_NAME}' configured with user '${DB_USER}'"
}

# === App User ===
create_app_user() {
    log_info "Creating system user '${APP_USER}'..."
    if id "$APP_USER" &>/dev/null; then
        log_warn "User '${APP_USER}' already exists. Skipping."
    else
        useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER" \
            || die "Failed to create system user '${APP_USER}'."
    fi
    log_ok "System user '${APP_USER}' ready"
}

# === Download App ===
download_app() {
    log_info "Downloading application from GitHub..."
    local tmp_zip="/tmp/${APP_NAME}.zip"

    curl -fsSL "$GITHUB_ZIP" -o "$tmp_zip" >> "$LOG_FILE" 2>&1 \
        || die "Failed to download application from GitHub."

    log_info "Extracting application to ${APP_DIR}..."
    unzip -qo "$tmp_zip" -d /tmp >> "$LOG_FILE" 2>&1 \
        || die "Failed to extract application archive."

    mv /tmp/house-expense-tracker-backend-main "$APP_DIR" \
        || die "Failed to move application to ${APP_DIR}."

    rm -f "$tmp_zip"
    log_ok "Application extracted to ${APP_DIR}"
}

# === JWT Keys ===
generate_jwt_keys() {
    log_info "Generating JWT key pair..."
    local key_dir="${APP_DIR}/local"
    mkdir -p "$key_dir"

    openssl genrsa -out "${key_dir}/jwtRS256.key" 2048 >> "$LOG_FILE" 2>&1 \
        || die "Failed to generate JWT private key."
    openssl rsa -in "${key_dir}/jwtRS256.key" -pubout -outform PEM \
        -out "${key_dir}/jwtRS256.key.pub" >> "$LOG_FILE" 2>&1 \
        || die "Failed to generate JWT public key."

    JWT_PRIVATE=$(base64 -w 0 "${key_dir}/jwtRS256.key")
    JWT_PUBLIC=$(base64 -w 0 "${key_dir}/jwtRS256.key.pub")
    log_ok "JWT key pair generated"
}

# === .env Configuration ===
write_env_file() {
    log_info "Writing .env configuration..."
    cat > "${APP_DIR}/.env" <<EOF
APP_ENV=production
APP_PORT=${APP_PORT}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
JWT_ACCESS_TOKEN_EXP_IN_SEC=3600
JWT_REFRESH_TOKEN_EXP_IN_SEC=7200
JWT_PUBLIC_KEY_BASE64=${JWT_PUBLIC}
JWT_PRIVATE_KEY_BASE64=${JWT_PRIVATE}
DEFAULT_ADMIN_USER_PASSWORD=${ADMIN_PASSWORD}
EOF
    # Restrict permissions on .env (contains secrets)
    chmod 600 "${APP_DIR}/.env"
    log_ok ".env file written"
}

# === Build App ===
build_app() {
    log_info "Installing npm dependencies (this may take a few minutes)..."
    cd "$APP_DIR"
    npm install --production=false >> "$LOG_FILE" 2>&1 \
        || die "Failed to install npm dependencies."
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

# === Systemd Service ===
setup_systemd() {
    log_info "Creating systemd service..."

    cat > "/etc/systemd/system/${APP_NAME}.service" <<EOF
[Unit]
Description=House Expense Tracker Backend
After=network.target postgresql.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/node dist/src/main
Restart=on-failure
RestartSec=10
EnvironmentFile=${APP_DIR}/.env

[Install]
WantedBy=multi-user.target
EOF

    # Set ownership so the service user can access the app
    chown -R "${APP_USER}:${APP_USER}" "$APP_DIR"

    systemctl daemon-reload
    systemctl enable "${APP_NAME}.service" >> "$LOG_FILE" 2>&1
    systemctl start "${APP_NAME}.service" >> "$LOG_FILE" 2>&1
    log_ok "Systemd service created and started"
}

# === Banners ===
print_banner() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║          House Expense Tracker — Installer                  ║"
    echo "║                                                            ║"
    echo "║  This will install and configure everything automatically. ║"
    echo "║  Estimated time: 5–10 minutes.                             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

print_success() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  ✅  Installation Complete!                                 ║"
    echo "║                                                            ║"
    echo "║  The app is running at:  http://localhost:${APP_PORT}            ║"
    echo "║                                                            ║"
    echo "║  Useful commands:                                          ║"
    echo "║    sudo systemctl status  ${APP_NAME}                ║"
    echo "║    sudo systemctl restart ${APP_NAME}                ║"
    echo "║    sudo systemctl stop    ${APP_NAME}                ║"
    echo "║                                                            ║"
    echo "║  Install log: ${LOG_FILE}   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

# === Main ===
main() {
    print_banner
    preflight_checks
    install_system_deps
    install_nodejs
    install_postgresql
    configure_database
    create_app_user
    download_app
    generate_jwt_keys
    write_env_file
    build_app
    setup_systemd
    print_success
}

main "$@"
