@echo off
cd /d "C:\Users\Huraira\Desktop\huraira box\1-AVANYX-POS"

echo === CLIENT BUILD with VITE_API_URL baked in ===
set VITE_API_URL=https://huraira4545.vercel.app
call npm run build:client
echo VITE_BUILD_EXIT=%ERRORLEVEL%

echo.
echo === VERIFY backend host is baked into the client bundle ===
findstr /S /M /C:"huraira4545.vercel.app" dist\assets\*.js >nul 2>&1
if errorlevel 1 (echo BAKED_MISSING & goto :eof)
echo BAKED_OK

echo.
echo === FIREBASE DEPLOY (hosting + firestore rules, project admin-3666e) ===
call npx --no-install firebase deploy --only hosting,firestore:rules
echo FIREBASE_EXIT=%ERRORLEVEL%
echo FB_DEPLOY_SCRIPT_DONE
