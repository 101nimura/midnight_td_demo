@echo off
chcp 65001 >nul
REM Pactora UI 版の単一 HTML を http://localhost:8081/ で配信します（Windows の Python を使用）
REM 配信は dist-pactora フォルダのみ・この PC からのみ（127.0.0.1）に限定しています
REM ※ file:// で直接開く場合は、Lace 拡張機能の「ファイルの URL へのアクセスを許可」を ON にしてください
cd /d "%~dp0dist-pactora"
echo http://localhost:8081/pactora-tdeposit-demo.html を開いてください（終了は Ctrl+C）
python -m http.server 8081 --bind 127.0.0.1
