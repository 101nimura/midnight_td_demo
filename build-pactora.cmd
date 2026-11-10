@echo off
chcp 65001 >nul
REM Pactora UI 版の単一 HTML をビルドします → dist-pactora\pactora-tdeposit-demo.html
setlocal
if not defined WSL_DISTRO set "WSL_DISTRO=Ubuntu"
wsl -d %WSL_DISTRO% --cd "%~dp0." -- bash .tools/npm.sh run build:pactora
