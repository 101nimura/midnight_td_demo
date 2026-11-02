@echo off
REM 単一 HTML 版を http://localhost:8080/tdeposit-demo.html で配信します（Windows の Python を使用）
REM ※ file:// で直接開く場合は、Lace 拡張機能の「ファイルの URL へのアクセスを許可」を ON にしてください
cd /d %~dp0dist-single
echo http://localhost:8080/tdeposit-demo.html を開いてください（終了は Ctrl+C）
python -m http.server 8080
