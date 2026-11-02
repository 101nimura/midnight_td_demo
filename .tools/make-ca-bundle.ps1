# Proof Server コンテナ用の CA バンドル（certs\ca-bundle.crt）を作成する
#   - 社内 TLS 検査（Netskope 等）がある環境: 社内ルート証明書を標準 CA に追加
#   - TLS 検査がない環境: 標準 CA のみ（proof-server.yml がこのファイルを必ずマウントするため）
#   使い方: make-ca-bundle.cmd            （既定は Netskope を検索）
#           .tools\make-ca-bundle.ps1 -Pattern '*zscaler*'
param([string]$Pattern = '*netskope*')
$root = Split-Path -Parent $PSScriptRoot
$distro = if ($env:WSL_DISTRO) { $env:WSL_DISTRO } else { 'Ubuntu' }
New-Item -ItemType Directory -Force -Path "$root\certs" | Out-Null
$certs = Get-ChildItem Cert:\LocalMachine\Root, Cert:\CurrentUser\Root, Cert:\LocalMachine\CA |
  Where-Object { $_.Subject -like $Pattern } | Sort-Object Thumbprint -Unique
$pem = ''
foreach ($c in $certs) {
  $pem += "-----BEGIN CERTIFICATE-----`n" + [Convert]::ToBase64String($c.RawData, 'InsertLineBreaks') + "`n-----END CERTIFICATE-----`n"
}
[IO.File]::WriteAllText("$root\certs\netskope.pem", $pem.Replace("`r", ''))
if ($certs) {
  Write-Host "社内ルート証明書 $(@($certs).Count) 件を certs\netskope.pem に書き出しました（Pattern=$Pattern）"
} else {
  Write-Host "社内ルート証明書は見つかりませんでした（Pattern=$Pattern）。標準 CA のみでバンドルを作成します"
}
# WSL の標準 CA バンドルと結合（WSL 側でカレントディレクトリをリポジトリにして実行）
wsl -d $distro --cd "$root" -- bash -c "cat /etc/ssl/certs/ca-certificates.crt certs/netskope.pem > certs/ca-bundle.crt"
if ($LASTEXITCODE -ne 0) { Write-Host "失敗しました。WSL ($distro) が使えるか確認してください"; exit 1 }
Write-Host "certs\ca-bundle.crt を作成しました"
