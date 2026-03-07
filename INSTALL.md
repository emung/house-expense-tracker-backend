# House Expense Tracker — Installation Guide

Automatic installer for the **House Expense Tracker** (Backend + Frontend) on a fresh Linux Mint system.  
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

Wait **5–10 minutes**. When finished:

- **Frontend UI** is live at **http://haus.local**
- **Backend API** is live at **http://haus.local/api/v1**

> Any device on the same local network can access the UI by opening `http://haus.local` in a browser.

---

## What Gets Installed

| Component            | Details                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| **Node.js 20**       | Via NodeSource APT repository                                                         |
| **PostgreSQL**       | Database server with a dedicated `house_app` user                                     |
| **NestJS Backend**   | Downloaded from GitHub, built and deployed to `/opt/house-expense-tracker`            |
| **React Native UI**  | Downloaded from GitHub, built as static web export to `/opt/house-expense-tracker-ui` |
| **nginx**            | Reverse proxy — serves UI on port 80 and forwards `/api/` to the backend              |
| **avahi-daemon**     | mDNS — broadcasts `haus.local` on the local network                                   |
| **systemd services** | Two services auto-start backend and frontend on boot                                  |

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
11. **Build backend** — Runs `npm install`, `npm run build`, and database migrations
12. **Backend systemd service** — Creates, enables, and starts the backend service
13. **Admin user** — Creates default admin user via the API
14. **Download UI** — Fetches and extracts the React Native frontend from GitHub
15. **Build UI** — Runs `npm install`, builds a static web export with `expo export`
16. **UI systemd service** — Creates, enables, and starts the frontend service (static files served on port 8080)
17. **Hostname & mDNS** — Sets hostname to `haus`, enables avahi-daemon to broadcast `haus.local`
18. **nginx reverse proxy** — Routes `http://haus.local` → UI and `http://haus.local/api/` → backend

## Default Configuration

| Setting               | Value                                  |
| --------------------- | -------------------------------------- |
| Backend install path  | `/opt/house-expense-tracker`           |
| Frontend install path | `/opt/house-expense-tracker-ui`        |
| Backend port          | `3000`                                 |
| Frontend port         | `8080` (proxied via nginx on port 80)  |
| Local network URL     | `http://haus.local`                    |
| Database name         | `house_expenses`                       |
| Database user         | `house_app`                            |
| Database password     | Auto-generated (32-char random string) |
| JWT keys              | Auto-generated RSA 2048-bit            |
| Admin password        | `admin`                                |
| Service user          | `housetracker`                         |

## Managing the Service

After installation, use these commands to control the services:

```bash
# Backend
sudo systemctl status  house-expense-tracker
sudo systemctl restart house-expense-tracker
sudo systemctl stop    house-expense-tracker
sudo journalctl -u house-expense-tracker -f

# Frontend
sudo systemctl status  house-expense-tracker-ui
sudo systemctl restart house-expense-tracker-ui
sudo systemctl stop    house-expense-tracker-ui
sudo journalctl -u house-expense-tracker-ui -f

# Nginx
sudo systemctl status  nginx
sudo systemctl restart nginx
sudo nginx -t  # test configuration
```

## Upgrading

When a new version is available, run the upgrade script:

```bash
sudo bash upgrade.sh
```

This takes **3–5 minutes** and will:

- Download the latest backend and frontend versions from GitHub
- **Preserve** your database, `.env` configuration, and JWT keys
- Rebuild the backend and run any new database migrations
- Reinstall frontend dependencies and rebuild the static web export
- Restart both services automatically

> **Note:** The upgrade log is saved to `/var/log/house-expense-tracker-upgrade.log`

## Logs

- **Install log:** `/var/log/house-expense-tracker-install.log`
- **Upgrade log:** `/var/log/house-expense-tracker-upgrade.log`
- **Backend runtime logs:** `sudo journalctl -u house-expense-tracker`
- **Frontend runtime logs:** `sudo journalctl -u house-expense-tracker-ui`

## Troubleshooting

### Installation fails

The script stops on the first error and prints a message. Check the full log:

```bash
cat /var/log/house-expense-tracker-install.log
```

### "Already installed" error

The script won't run if `/opt/house-expense-tracker` already exists. To reinstall:

```bash
sudo systemctl stop house-expense-tracker house-expense-tracker-ui
sudo systemctl disable house-expense-tracker house-expense-tracker-ui
sudo rm -rf /opt/house-expense-tracker /opt/house-expense-tracker-ui
sudo rm /etc/systemd/system/house-expense-tracker.service /etc/systemd/system/house-expense-tracker-ui.service
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

The easiest way to uninstall is to run the uninstall script:

```bash
sudo bash uninstall.sh
```

Alternatively, to manually remove everything:

```bash
# Stop and remove both services
sudo systemctl stop house-expense-tracker house-expense-tracker-ui
sudo systemctl disable house-expense-tracker house-expense-tracker-ui
sudo rm /etc/systemd/system/house-expense-tracker.service /etc/systemd/system/house-expense-tracker-ui.service
sudo systemctl daemon-reload

# Remove nginx config
sudo rm -f /etc/nginx/sites-enabled/house-expense-tracker /etc/nginx/sites-available/house-expense-tracker
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
sudo systemctl reload nginx

# Remove the applications
sudo rm -rf /opt/house-expense-tracker /opt/house-expense-tracker-ui

# Remove the database (optional)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS house_expenses;"
sudo -u postgres psql -c "DROP USER IF EXISTS house_app;"

# Remove the system user (optional)
sudo userdel housetracker
```
