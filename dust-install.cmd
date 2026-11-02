@echo off
REM DUST 代替ツールの依存関係をインストール（初回のみ）
wsl -d Ubuntu -- bash /mnt/c/Users/ynimura/midnight_demo/.tools/dustnpm.sh install
