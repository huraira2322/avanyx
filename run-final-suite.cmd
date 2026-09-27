@echo off
cd /d C:\Users\Huraira\Desktop\GITHUB\AVANYX

echo === stopping server on port 3000 ===
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 3 /nobreak >nul

echo === starting server with VALID keys ===
start /B cmd /c "node_modules\.bin\tsx.cmd server.ts > final-server-out.log 2> final-server-err.log"
timeout /t 35 /nobreak >nul

echo === full integration suite ===
node test-ai-ask-integration.cjs > final-integration-result.log 2>&1

echo === refined suite ===
node test-refined.cjs > final-refined-result.log 2>&1

echo DONE
