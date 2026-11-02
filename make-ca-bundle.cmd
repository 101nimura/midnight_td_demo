@echo off
chcp 65001 >nul
REM Proof Server 用の CA バンドル（certs\ca-bundle.crt）を作成します
REM 社内 TLS 検査（Netskope 等）があれば社内ルート証明書を追加、無ければ標準 CA のみ
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0.tools\make-ca-bundle.ps1" %*
