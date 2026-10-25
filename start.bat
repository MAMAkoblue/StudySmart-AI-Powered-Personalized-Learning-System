@echo off
cd /d "%~dp0backend"
start "StudySmart Backend" cmd /k "npm start"
cd /d "%~dp0frontend"
start "StudySmart Frontend" cmd /k "npm run dev"
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause