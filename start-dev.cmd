@echo off
chcp 65001 >nul
REM WSL 上で Vite 開発サーバを起動します → http://localhost:5173
setlocal
if not defined WSL_DISTRO set "WSL_DISTRO=Ubuntu"
wsl -d %WSL_DISTRO% --cd "%~dp0." -- bash .tools/npm.sh run dev
