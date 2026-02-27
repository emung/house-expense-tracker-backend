# House Expense Tracker — Installation Guide

Automatic installer for the **House Expense Tracker Backend** on a fresh Linux Mint system.  
The installer handles everything — no technical knowledge required.

---

## Requirements

- **Linux Mint** (fresh install recommended)
- **Internet connection**
- **sudo** access

## Quick Start

```bash
sudo bash install.sh
```

Wait **5–10 minutes**. When finished, the app is live at **http://localhost:3000**.

---

## What Gets Installed

| Component | Details |
|-----------|---------|
| **Node.js 20** | Via NodeSource APT repository |
| **PostgreSQL** | Database server with a dedicated `house_app` user |
| **NestJS App** | Downloaded from GitHub, built and deployed to `/opt/house-expense-tracker` |
| **systemd service** | Auto-starts the app on boot |

## Installation Steps

The script performs these steps sequentially, aborting on any failure:

1. **Pre-flight checks** — Verifies sudo, internet connectivity, and no prior install
2. **System update** — `apt update && apt upgrade`
3. **Base dependencies** — Installs `curl`, `unzip`, `openssl`, `build-essential`
4. **Node.js 20** — Adds the NodeSource repo and installs Node
5. **PostgreSQL** — Installs, enables, and starts the database server
6. **Database setup** — Creates user `house_app`, database `house_expenses`, random password
7. **System user** — Creates unprivileged `housetracker` user to run the app
8. **Download app** — Fetches and extracts the latest version from GitHub
9. **JWT keys** — Generates RSA 2048-bit key pair for authentication
10. **Environment config** — Writes `.env` with all generated values
11. **Build** — Runs `npm install`, `npm run build`, and database migrations
12. **systemd service** — Creates, enables, and starts the service

## Default Configuration

| Setting | Value |
|---------|-------|
| Install path | `/opt/house-expense-tracker` |
| App port | `3000` |
| Database name | `house_expenses` |
| Database user | `house_app` |
| Database password | Auto-generated (32-char random string) |
| JWT keys | Auto-generated RSA 2048-bit |
| Admin password | `admin` |
| Service user | `housetracker` |

## Managing the Service

After installation, use these commands to control the app:

```bash
# Check status
sudo systemctl status house-expense-tracker

# Restart the app
sudo systemctl restart house-expense-tracker

# Stop the app
sudo systemctl stop house-expense-tracker

# View app logs
sudo journalctl -u house-expense-tracker -f
```

## Logs

- **Install log:** `/var/log/house-expense-tracker-install.log`
- **Runtime logs:** `sudo journalctl -u house-expense-tracker`

## Troubleshooting

### Installation fails

The script stops on the first error and prints a message. Check the full log:

```bash
cat /var/log/house-expense-tracker-install.log
```

### "Already installed" error

The script won't run if `/opt/house-expense-tracker` already exists. To reinstall:

```bash
sudo systemctl stop house-expense-tracker
sudo systemctl disable house-expense-tracker
sudo rm -rf /opt/house-expense-tracker
sudo rm /etc/systemd/system/house-expense-tracker.service
sudo systemctl daemon-reload
sudo bash install.sh
```

### App not responding after reboot

Verify the service is running:

```bash
sudo systemctl status house-expense-tracker
```

If it failed to start, check the logs:

```bash
sudo journalctl -u house-expense-tracker --no-pager -n 50
```

### Database connection errors

Verify PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

## Uninstall

To completely remove the application:

```bash
# Stop and remove the service
sudo systemctl stop house-expense-tracker
sudo systemctl disable house-expense-tracker
sudo rm /etc/systemd/system/house-expense-tracker.service
sudo systemctl daemon-reload

# Remove the application
sudo rm -rf /opt/house-expense-tracker

# Remove the database (optional)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS house_expenses;"
sudo -u postgres psql -c "DROP USER IF EXISTS house_app;"

# Remove the system user (optional)
sudo userdel housetracker
```
