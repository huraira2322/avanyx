@echo off
cd /d C:\Users\Huraira\Desktop\GITHUB\AVANYX

echo === stopping server on port 3000 ===
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 3 /nobreak >nul

echo === starting server with INVALID DEEPSEEK_API_KEY ===
set DEEPSEEK_API_KEY=sk-invalid-deepseek-failover-test-key-000000
start /B cmd /c "node_modules\.bin\tsx.cmd server.ts > fallback-server-out.log 2> fallback-server-err.log"

echo === waiting for boot ===
timeout /t 35 /nobreak >nul

echo === running fallback test ===
node test-fallback.cjs > fallback-test-result.log 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> fallback-test-result.log
echo DONE
