@echo off
REM 単一 HTML 版をビルドします → dist-single\tdeposit-demo.html
wsl -d Ubuntu -- bash /mnt/c/Users/ynimura/midnight_demo/.tools/npm.sh run build:single
