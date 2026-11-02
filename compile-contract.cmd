@echo off
chcp 65001 >nul
REM Compact コントラクトをコンパイルします（ZK 鍵生成込み。数分かかります）
setlocal
if not defined WSL_DISTRO set "WSL_DISTRO=Ubuntu"
wsl -d %WSL_DISTRO% --cd "%~dp0." -- bash .tools/compile.sh
