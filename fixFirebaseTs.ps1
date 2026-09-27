$file = 'src\lib\firebase.ts'
$content = Get-Content $file -Raw

$content = $content -replace "const defaultBizId = cachedActiveBizId \|\| ``biz-\$\{fbUser\.uid\.substring\(0, 10\)\}``;", "const defaultBizId = ``biz-`$(`$fbUser.uid)``;"
$content = $content -replace "activeBizId = profile\.ownerBusinessId \|\| cachedActiveBizId \|\| \(profile\.authorizedBusinessIds && profile\.authorizedBusinessIds\[0\]\) \|\| defaultBizId;", "activeBizId = profile.ownerBusinessId || (profile.authorizedBusinessIds && profile.authorizedBusinessIds[0]) || defaultBizId;"
$content = $content -replace "activeBizId = profile\.ownerBusinessId \|\| cachedActiveBizId \|\| defaultBizId;", "activeBizId = profile.ownerBusinessId || defaultBizId;"
$content = $content -replace "(?sm)// New User Setup\s+let assignedBizId = cachedActiveBizId \|\| '';\s+if \(!assignedBizId\) \{\s+assignedBizId = defaultBizId;\s+if \(!isOffline\) \{\s+const newBizRef = doc\(db, 'businesses', assignedBizId\);\s+setDoc\(newBizRef, defaultBusiness, \{ merge: true \}\)\.catch\(\(\) => \{\}\);\s+\}\s+\}", "// New User Setup`n    let assignedBizId = defaultBizId;"

Set-Content $file -Value $content
