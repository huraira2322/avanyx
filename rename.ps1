$items = Get-ChildItem -Path "c:\Users\Huraira\Desktop\huraira box\1-AVANYX-POS" -Recurse | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.git\\' -and $_.FullName -notmatch '\\dist\\' -and $_.FullName -notmatch '\\build\\' }

# Rename files and directories, deepest first
$items = $items | Sort-Object -Property @{Expression={$_.FullName.Length}; Descending=$true}

foreach ($item in $items) {
    if ($item.Name -match 'Avanyx' -or $item.Name -match 'avanyx' -or $item.Name -match 'Avanyx' -or $item.Name -match 'avanyx' -or $item.Name -match 'AVANYX' -or $item.Name -match 'Avanyx') {
        $newName = $item.Name -replace 'Avanyx', 'Avanyx'
        $newName = $newName -replace 'avanyx', 'avanyx'
        $newName = $newName -replace 'Avanyx', 'Avanyx'
        $newName = $newName -replace 'avanyx', 'avanyx'
        $newName = $newName -replace 'AVANYX', 'AVANYX'
        $newName = $newName -replace 'Avanyx', 'Avanyx'
        
        Write-Host "Renaming: $($item.FullName) to $newName"
        Rename-Item -Path $item.FullName -NewName $newName
    }
}
