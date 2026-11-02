@echo off
REM WSL (Ubuntu) 上で Vite 開発サーバを起動します → http://localhost:5173
wsl -d Ubuntu -- bash /mnt/c/Users/ynimura/midnight_demo/.tools/npm.sh run dev
