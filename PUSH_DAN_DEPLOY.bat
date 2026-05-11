@echo off
echo ========================================
echo MENGIRIM KODE KE GITHUB DAN DEPLOY...
echo ========================================

git add .
set /p msg="Masukkan pesan commit: "
if "%msg%"=="" set msg="Update Loket Alfaza"

git commit -m "%msg%"
git push origin main

echo ========================================
echo BERHASIL! GitHub Action akan memproses deployment.
echo ========================================
pause
