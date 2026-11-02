@echo off
REM コントラクトのローカルシミュレータテスト
wsl -d Ubuntu -- bash /mnt/c/Users/ynimura/midnight_demo/.tools/npm.sh test
