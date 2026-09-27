@echo off
cd /d C:\Users\Huraira\Desktop\GITHUB\AVANYX
if not exist brain-out mkdir brain-out
call node_modules\.bin\tsc.cmd src\server\conversationBrain.ts --outDir brain-out --module commonjs --target es2020 --skipLibCheck --esModuleInterop
if not exist brain-out\conversationBrain.js (echo COMPILE_FAIL & goto :eof)
copy /y brain-out\conversationBrain.js brain-out\conversationBrain.cjs >nul
echo === DIAG VARIANT A + B ===
node diag-brain-variants.cjs
echo === UNIT SUITE ===
node test-conversation-brain.cjs
echo UNIT_EXIT=%ERRORLEVEL%
