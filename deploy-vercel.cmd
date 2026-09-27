@echo off
cd /d "C:\Users\Huraira\Desktop\huraira box\1-AVANYX-POS"
echo === LOCAL REBUILD (dist/server.cjs with brain+gemini fixes) ===
call npm run build
echo BUILD_EXIT=%ERRORLEVEL%
echo.
echo === VERCEL PRODUCTION DEPLOY (project huraira4545) ===
call npx --yes vercel@latest --prod --yes
echo VERCEL_EXIT=%ERRORLEVEL%
echo DEPLOY_SCRIPT_DONE
