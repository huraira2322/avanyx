@echo off
cd /d C:\Users\Huraira\Desktop\GITHUB\AVANYX
set AVANYX_BASE=https://huraira4545.vercel.app
node check-live-brain.cjs
echo VERCEL_PROBE_EXIT=%ERRORLEVEL%
echo PROBE_VERCEL_DONE
