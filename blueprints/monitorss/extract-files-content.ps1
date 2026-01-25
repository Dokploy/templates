# Set the root project directory
$projectRoot    = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootFolderName = Split-Path $projectRoot -Leaf

# Ask the user where to save the output (mantido)
$choice = Read-Host "Do you want to save the output in the current folder (Y), the parent folder (N), or a custom path (C)? [Y/N/C]"
switch ($choice.ToUpper()) {
    "Y" { $saveBase = $projectRoot; break }
    "N" { $saveBase = Split-Path $projectRoot -Parent; break }
    "C" {
        $saveBase = Read-Host "Enter the full path where you want to save the output"
        break
    }
    default {
        Write-Host "Invalid option. Defaulting to current folder."
        $saveBase = $projectRoot
    }
}

# Create the output directory named after the project root
$outputDir = Join-Path $saveBase "extraction_$rootFolderName"

# --- Folder blacklist (edit here; names or patterns relative to root) ---
# Examples:
# 'node_modules' → excludes any folder named node_modules
# 'dist' → excludes any dist
# 'docs/*' → excludes everything inside docs (immediate level only)
# 'extraction_*' → avoids capturing old exports
# '.git' → excludes the entire .git folder
$folderBlacklist = @(
    '.git',
    '.github',
    'node_modules',
    'dist',
    'build',
    '.next',
    '.cache',
    'extraction_*',
    'graphics'
)

# --- File blacklist (edit here; names or patterns relative to root) ---
# Matches against the *relative path*. Wildcards allowed.
# Examples:
# '*.min.js' → any minified JS anywhere
# 'package-lock.json' → any file with this exact name
# 'src/generated/*' → anything under src/generated
# '.env*' '*.pem' '*.key' → sensitive files
$fileBlacklist = @(
    '*.min.js',
    '*.map',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'composer.lock',
    '.DS_Store',
    'Thumbs.db',
    'tsconfig.tsbuildinfo',
    '.env',
    '.env.*',
    '*.pem',
    '*.key',
    'src/generated/*',
    'changelog.txt'
)

# Function to test if a path is blacklisted (works for folders or files)
function Test-BlacklistedPath {
    param(
        [Parameter(Mandatory)][string]$FullPath,
        [Parameter(Mandatory)][string[]]$Patterns,
        [Parameter(Mandatory)][string]$Root,
        [string]$OutputDir
    )

    # Never export the output folder (if it is inside the project)
    if ($OutputDir -and $FullPath.StartsWith($OutputDir, [StringComparison]::OrdinalIgnoreCase)) {
        return $true
    }

    # Path relative to root, normalized to '/'
    $rel = $FullPath.Substring($Root.Length).TrimStart('\','/')
    $rel = $rel -replace '\\','/'

    foreach ($p in $Patterns) {
        if ([string]::IsNullOrWhiteSpace($p)) { continue }
        $p = $p.Trim().Replace('\','/')

        # Wildcards? Use -like on the relative path.
        if ($p -match '[\*\?\[]') {
            $likePattern = $p
            if ($rel -like $likePattern) { return $true }
            if (("/" + $rel) -like ("*/" + $likePattern.TrimStart('/'))) { return $true }
        }
        else {
            # Exact segment match (case-insensitive) for names like "package-lock.json"
            $segRegex = "(^|/)$([regex]::Escape($p))(/|$)"
            if ($rel -match $segRegex) { return $true }
        }
    }
    return $false
}

# Create output folder after setting everything
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

# Define the Markdown output file
$outputFile = Join-Path $outputDir 'extractedContent.md'

# Remove old output file if it exists
if (Test-Path $outputFile) {
    try { Remove-Item $outputFile -Force } catch { Write-Host "Failed to delete the old file. Please close any program using it."; exit }
}

# Mapping of file extensions to decide inclusion
$languageMap = @{
    '.php'   = $true; 
    '.js'    = $true;  
    '.ts'    = $true;
    '.jsx'   = $true; 
    '.tsx'   = $true; 
    '.html'  = $true;
    '.css'   = $true; 
    '.json'  = $true; 
    '.xml'   = $true;
    '.md'    = $false; 
    '.py'    = $true; 
    '.sh'    = $false;
    '.c'     = $true; 
    '.cpp'   = $true; 
    '.cs'    = $true;
    '.java'  = $true; 
    '.go'    = $true; 
    '.rb'    = $true;
    '.rs'    = $true; 
    '.swift' = $true; 
    '.kt'    = $true;
    '.scala' = $true; 
    '.lua'   = $true; 
    '.yml'   = $true;
    '.yaml'  = $true; 
    '.ini'   = $true; 
    '.toml'  = $true;
    '.env'   = $false; 
    '.true'   = $false; 
    '.bat'   = $true;
    '.conf'  = $false; 
    '.cfg'   = $false;
    '.txt'   = $true;  
    '.gitignore'      = $false;
    '.gitattributes'  = $false;
}

# Files without extensions that should always be included
$alwaysAllow = @(
    'Dockerfile', 'Makefile', '.prettierrc',
    '.editorconfig', '.eslintrc', '.babelrc'
)

# --- Enumerar e FILTRAR (respeitando as blacklists) ---
$allDirs = Get-ChildItem -Path $projectRoot -Recurse -Directory | Where-Object {
    -not (Test-BlacklistedPath -FullPath $_.FullName -Patterns $folderBlacklist -Root $projectRoot -OutputDir $outputDir)
}

$allFiles = Get-ChildItem -Path $projectRoot -Recurse -File | Where-Object {
    (-not (Test-BlacklistedPath -FullPath $_.FullName -Patterns $folderBlacklist -Root $projectRoot -OutputDir $outputDir)) -and
    (-not (Test-BlacklistedPath -FullPath $_.FullName -Patterns $fileBlacklist   -Root $projectRoot -OutputDir $outputDir))
}

# Process each file and append its content in fenced code blocks
foreach ($file in $allFiles) {
    $ext  = $file.Extension.ToLower()
    $name = $file.Name

    # Determine if the file should be included
    $shouldInclude = ($languageMap.ContainsKey($ext) -and $languageMap[$ext]) -or ($alwaysAllow -contains $name)
    if (-not $shouldInclude) { continue }

    # Read file content or mark as error
    try { $content = Get-Content -Path $file.FullName -Raw } catch { $content = "[ERROR READING FILE]" }

    Add-Content -Path $outputFile -Value "### $name"
    Add-Content -Path $outputFile -Value '```'
    Add-Content -Path $outputFile -Value $content
    Add-Content -Path $outputFile -Value '```'
    Add-Content -Path $outputFile -Value ''
}

# Append a styled summary section
Add-Content -Path $outputFile -Value '## 📝 Processing Summary'
Add-Content -Path $outputFile -Value ''
Add-Content -Path $outputFile -Value "- 📁 Directories processed (after blacklist): $($allDirs.Count)"
Add-Content -Path $outputFile -Value "- 📄 Files processed (after blacklist): $($allFiles.Count)"
Add-Content -Path $outputFile -Value ''

# List of Directories with root folder prefix
Add-Content -Path $outputFile -Value '### 📁 List of Directories'
Add-Content -Path $outputFile -Value ''
foreach ($d in $allDirs) {
    $relative = $d.FullName.Substring($projectRoot.Length + 1)
    Add-Content -Path $outputFile -Value "- $rootFolderName\$relative"
}
Add-Content -Path $outputFile -Value ''

# List of Files with root folder prefix
Add-Content -Path $outputFile -Value '### 📄 List of Files'
Add-Content -Path $outputFile -Value ''
foreach ($f in $allFiles) {
    $relative = $f.FullName.Substring($projectRoot.Length + 1)
    Add-Content -Path $outputFile -Value "- $rootFolderName\$relative"
}

Write-Host "`n✅ Markdown file successfully generated at:`n$outputFile"
