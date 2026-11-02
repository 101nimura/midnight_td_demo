@echo off
REM Lace で DUST を生成できない場合の代替ツール
REM   使い方: dust-designate.cmd <Lace の DUST アドレス mn_dust_preview1...>
REM   ※ Proof Server (localhost:6300) を起動しておくこと。初回は同期に 10〜15 分かかります。
if "%~1"=="" (
  echo 使い方: dust-designate.cmd ^<Lace の DUST アドレス^>
  exit /b 1
)
wsl -d Ubuntu -- bash /mnt/c/Users/ynimura/midnight_demo/.tools/dustnpm.sh start -- %1
