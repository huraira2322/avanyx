@echo off
cd /d "C:\Users\Huraira\Desktop\huraira box\1-AVANYX-POS"
echo ################ 1/2 VERCEL (backend + client) ################
call deploy-vercel.cmd
echo ################ 2/2 FIREBASE HOSTING (VITE_API_URL baked) ################
call deploy-firebase.cmd
echo ALL_DEPLOYS_DONE
