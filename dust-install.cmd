@echo off
chcp 65001 >nul
REM DUST 代替ツールの依存関係をインストール（初回のみ）
setlocal
if not defined WSL_DISTRO set "WSL_DISTRO=Ubuntu"
wsl -d %WSL_DISTRO% --cd "%~dp0." -- bash .tools/dustnpm.sh install
