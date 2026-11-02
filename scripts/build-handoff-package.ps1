param(
    [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$parentRoot = Split-Path -Parent $projectRoot
$projectName = Split-Path -Leaf $projectRoot

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $parentRoot "南开校园安全卫士_最新版完整交接包.zip"
}
$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
if (-not $OutputPath.StartsWith($parentRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "输出文件必须位于项目工作区内：$parentRoot"
}

$manifestPath = Join-Path $projectRoot "docs\交接包文件清单.txt"
$excludedNames = @("local-server.log", "local-server-error.log")

function Get-PackageFiles {
    Get-ChildItem -LiteralPath $projectRoot -Recurse -File -Force | Where-Object {
        $relative = $_.FullName.Substring($projectRoot.Length).TrimStart('\')
        $_.FullName -ne $OutputPath -and
        $_.Name -notin $excludedNames -and
        $relative -notmatch '(^|\\)\.tmp-' -and
        $relative -notmatch '(^|\\)__pycache__(\\|$)'
    } | Sort-Object FullName
}

$filesBeforeManifest = @(Get-PackageFiles | Where-Object { $_.FullName -ne $manifestPath })
$keyFiles = @(
    "server.js",
    "app.js",
    "knowledge.html",
    "admin-login.html",
    "styles.css",
    "data\quiz-questions.json",
    "data\safety-case-db.json",
    "database\nankai_security_guard_full.sql",
    "docs\南开校园安全卫士项目交接文档.docx",
    "docs\测试验收清单-20261027.md"
)

$manifest = New-Object System.Collections.Generic.List[string]
$manifest.Add("南开校园安全卫士完整交接包")
$manifest.Add("生成时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$manifest.Add("项目目录：$projectName")
$manifest.Add("说明：包含当前源代码、运行配置、JSON 数据、MySQL 完整备份、启动脚本和项目文档。")
$manifest.Add("")
$manifest.Add("关键文件 SHA256")
foreach ($relative in $keyFiles) {
    $full = Join-Path $projectRoot $relative
    if (-not (Test-Path -LiteralPath $full)) { throw "缺少关键文件：$relative" }
    $hash = (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash
    $manifest.Add("$hash  $relative")
}
$manifest.Add("")
$manifest.Add("全部文件清单")
foreach ($file in $filesBeforeManifest) {
    $relative = $file.FullName.Substring($projectRoot.Length).TrimStart('\')
    $manifest.Add(("{0,12}  {1}" -f $file.Length, $relative))
}
$manifest.Add(("{0,12}  {1}" -f 0, "docs\交接包文件清单.txt"))
[System.IO.File]::WriteAllLines($manifestPath, $manifest, [System.Text.UTF8Encoding]::new($true))

$files = @(Get-PackageFiles)
if (Test-Path -LiteralPath $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stream = [System.IO.File]::Open($OutputPath, [System.IO.FileMode]::CreateNew)
try {
    $archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create, $false, [System.Text.Encoding]::UTF8)
    try {
        foreach ($file in $files) {
            $relative = $file.FullName.Substring($projectRoot.Length).TrimStart('\').Replace('\', '/')
            $entryName = "$projectName/$relative"
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive,
                $file.FullName,
                $entryName,
                [System.IO.Compression.CompressionLevel]::Optimal
            ) | Out-Null
        }
    } finally {
        $archive.Dispose()
    }
} finally {
    $stream.Dispose()
}

$zipInfo = Get-Item -LiteralPath $OutputPath
$zipHash = (Get-FileHash -LiteralPath $OutputPath -Algorithm SHA256).Hash
Write-Output "PACKAGE=$($zipInfo.FullName)"
Write-Output "FILES=$($files.Count)"
Write-Output "BYTES=$($zipInfo.Length)"
Write-Output "SHA256=$zipHash"
