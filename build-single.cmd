@echo off
chcp 65001 >nul
REM 単一 HTML 版をビルドします → dist-single\tdeposit-demo.html
setlocal
if not defined WSL_DISTRO set "WSL_DISTRO=Ubuntu"
wsl -d %WSL_DISTRO% --cd "%~dp0." -- bash .tools/npm.sh run build:single
