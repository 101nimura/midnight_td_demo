@echo off
chcp 65001 >nul
REM Lace で DUST を生成できない場合の代替ツール
REM   使い方: dust-designate.cmd ^<Lace の DUST アドレス mn_dust_preview1...^>
REM   ※ Proof Server (localhost:6300) を起動しておくこと。初回は同期に 10〜15 分かかります。
setlocal
if not defined WSL_DISTRO set "WSL_DISTRO=Ubuntu"
if "%~1"=="" (
  echo 使い方: dust-designate.cmd ^<Lace の DUST アドレス mn_dust_preview1...^>
  exit /b 1
)
wsl -d %WSL_DISTRO% --cd "%~dp0." -- bash .tools/dustnpm.sh start -- %1
