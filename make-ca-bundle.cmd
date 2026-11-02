@echo off
REM 社内 TLS 検査（Netskope）環境で Proof Server を動かすための CA バンドル作成
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0.tools\make-ca-bundle.ps1"
