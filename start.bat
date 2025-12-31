@echo off
echo Starting GreenPages v8...
echo.

REM Stop existing processes on ports
echo Stopping existing processes...

REM Find and kill process on port 3000 (API)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F 2>nul
)

REM Find and kill process on port 3001 (Admin)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F 2>nul
)

REM Find and kill process on port 3002 (Web)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') do (
    taskkill /PID %%a /F 2>nul
)

REM Wait for processes to fully stop
timeout /t 2 /nobreak >nul
echo.

REM Start applications
echo Starting applications...

REM Start API
start "GreenPages API" cmd /k "cd /d %~dp0apps\api && pnpm dev"
echo API starting on port 3000...

REM Wait before starting next app
timeout /t 2 /nobreak >nul

REM Start Admin Dashboard
start "GreenPages Admin" cmd /k "cd /d %~dp0apps\admin && pnpm dev"
echo Admin Dashboard starting on port 3001...

REM Wait before starting next app
timeout /t 2 /nobreak >nul

REM Start Web App
start "GreenPages Web" cmd /k "cd /d %~dp0apps\web && pnpm dev"
echo Web App starting on port 3002...

REM Wait for apps to initialize
echo.
echo Waiting for applications to initialize...
timeout /t 8 /nobreak >nul

REM Open browsers
echo.
echo Opening browsers...

REM Open Web App
start http://localhost:3002

REM Wait 1 second
timeout /t 1 /nobreak >nul

REM Open Admin Dashboard
start http://localhost:3001

REM Wait 1 second
timeout /t 1 /nobreak >nul

REM Open MinIO Console
start http://localhost:9003

REM MinIO S3 API endpoint (optional)
REM http://localhost:9002

echo.
echo All apps started and opened in browser!
echo.
echo Press any key to stop all applications...
pause >nul

REM Stop all applications
echo.
echo Stopping applications...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') do (
    taskkill /PID %%a /F 2>nul
)
echo Applications stopped.
pause
