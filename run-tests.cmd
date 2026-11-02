@echo off
chcp 65001 >nul
REM コントラクトのローカルシミュレータテスト
setlocal
if not defined WSL_DISTRO set "WSL_DISTRO=Ubuntu"
wsl -d %WSL_DISTRO% --cd "%~dp0." -- bash .tools/npm.sh test
