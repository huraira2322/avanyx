$file = 'src\components\AuthPortal.tsx'
$content = Get-Content $file -Raw

$content = $content -replace "initialMode\?: 'login' \| 'signup' \| 'phone' \| 'staff' \| 'demo';", "initialMode?: 'login' | 'signup' | 'phone' | 'staff';"
$content = $content -replace "const \[activeTab, setActiveTab\] = useState<'owner' \| 'phone' \| 'staff' \| 'demo'>", "const [activeTab, setActiveTab] = useState<'owner' | 'phone' | 'staff'>"
$content = $content -replace "if \(initialMode === 'demo'\) return 'demo';", ""
$content = $content -replace "(?sm)  // Handle Quick Demo Login.*?  };", ""
$content = $content -replace "(?sm)<button[^>]+onClick=\{\(\) => setActiveTab\('demo'\)\}[^>]*>.*?<span.*?Demo</span>.*?</button>", ""
$content = $content -replace "(?sm)\{/\* TAB 4: INSTANT DEMO WORKSPACES \*/\}.*?(?=\{/\* Right Side: Security & Features \*/\})", ""
$content = $content -replace "activeTab === 'demo'\s*\?\s*'[^\']*'\s*:\s*", ""

Set-Content $file -Value $content
