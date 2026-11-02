# 社内 TLS 検査（Netskope 等）環境向け: Proof Server コンテナ用の CA バンドルを作成する
#   出力: certs\netskope.pem（社内ルート証明書） / certs\ca-bundle.crt（標準 CA + 社内ルート）
param([string]$Pattern = '*netskope*')
$root = Split-Path -Parent $PSScriptRoot
New-Item -ItemType Directory -Force -Path "$root\certs" | Out-Null
$certs = Get-ChildItem Cert:\LocalMachine\Root, Cert:\CurrentUser\Root, Cert:\LocalMachine\CA |
  Where-Object { $_.Subject -like $Pattern } | Sort-Object Thumbprint -Unique
if (-not $certs) { Write-Host "証明書が見つかりません（Pattern=$Pattern）。TLS 検査がない環境なら不要です。"; exit 1 }
$pem = ''
foreach ($c in $certs) {
  $pem += "-----BEGIN CERTIFICATE-----`n" + [Convert]::ToBase64String($c.RawData, 'InsertLineBreaks') + "`n-----END CERTIFICATE-----`n"
}
[IO.File]::WriteAllText("$root\certs\netskope.pem", $pem.Replace("`r", ''))
Write-Host "$($certs.Count) 件の社内ルート証明書を certs\netskope.pem に書き出しました"
# WSL(Ubuntu) の標準 CA バンドルと結合
$wslRoot = '/mnt/' + $root.Substring(0,1).ToLower() + $root.Substring(2).Replace([char]92,[char]47)
wsl -d Ubuntu -- bash -c "cat /etc/ssl/certs/ca-certificates.crt '$wslRoot/certs/netskope.pem' > '$wslRoot/certs/ca-bundle.crt'"
Write-Host "certs\ca-bundle.crt を作成しました"
