@echo off
chcp 65001 >nul
REM 依存パッケージをインストールします（初回・package.json 更新時）
setlocal
if not defined WSL_DISTRO set "WSL_DISTRO=Ubuntu"
wsl -d %WSL_DISTRO% --cd "%~dp0." -- bash .tools/npm.sh install
