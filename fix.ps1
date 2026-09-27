$file = 'src\context\AvanyxContext.tsx'
$content = Get-Content $file -Raw
$badString = "avanyx_active_business_id') || ''"
$fixed = $content.Replace($badString, "")
Set-Content $file -Value $fixed
