$files = Get-ChildItem -Path "c:\Users\Huraira\Desktop\huraira box\1-AVANYX-POS" -File -Recurse | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.git\\' -and $_.FullName -notmatch '\\dist\\' -and $_.FullName -notmatch '\\build\\' -and $_.Extension -notmatch '\.(png|jpg|ico|lock)$' -and $_.Name -ne 'package-lock.json' -and $_.Name -ne '.env' }
$count = 0
foreach ($f in $files) {
    $content = Get-Content -Path $f.FullName -Raw
    if ($content -match 'Avanyx' -or $content -match 'avanyx' -or $content -match 'Avanyx' -or $content -match 'avanyx' -or $content -match 'AVANYX' -or $content -match 'Avanyx' -or $content -match 'AVANYX') {
        Write-Host "Updating: $($f.FullName)"
        $newContent = $content -replace 'Avanyx', 'Avanyx'
        $newContent = $newContent -replace 'avanyx', 'avanyx'
        $newContent = $newContent -replace 'Avanyx', 'Avanyx'
        $newContent = $newContent -replace 'avanyx', 'avanyx'
        $newContent = $newContent -replace 'AVANYX', 'AVANYX'
        $newContent = $newContent -replace 'AVANYX', 'AVANYX'
        $newContent = $newContent -replace 'Avanyx', 'Avanyx'
        Set-Content -Path $f.FullName -Value $newContent -NoNewline
        $count++
    }
}
Write-Host "Total files updated: $count"
