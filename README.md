# PEA VOLTA N2 · Mark 2

Standalone GitHub Pages version of the original dashboard, exported 2026-10-09. Original site unchanged.

## Enable hosting
Settings → Pages → Source: **GitHub Actions**. Then Actions → Refresh data and deploy Pages → Run workflow.

Expected URL: https://chaleamchonppp-tech.github.io/PEA-N2-Oct2026/

## Data
The initial dataset and update history were read from the live original site. GitHub Actions reads the same publicly accessible Google Sheets XLSX export on a roughly 15-minute schedule. Scheduled runs can be delayed by GitHub; inactive public repository schedules may be disabled after 60 days. The browser checks the deployed JSON every 15 minutes. The refresh button checks the deployed JSON; it does not trigger a GitHub workflow.

If reading Sheets fails, previous data is retained and the dashboard shows an error. Edit the source Google Sheet to change station and repair data. No ChatGPT API, login, database, or original host is required. Map services remain external dependencies.

## Manual update
Actions → Refresh data and deploy Pages → Run workflow, or edit data/dataset.json and commit. Update code/assets in this repository to modify the website.

This repository and published site are public. Do not add credentials or confidential files.
