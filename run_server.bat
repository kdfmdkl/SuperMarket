@echo off
cd /d D:\SuperMakretMini\SuperMarketMini\SuperMarketMini
start dotnet run --urls "http://localhost:5000"
timeout /t 3 /nobreak >nul
echo.
echo ===================================
echo Server dang khoi dong...
echo API: http://localhost:5000
echo Swagger: http://localhost:5000/swagger
echo ===================================
echo.
echo De stop server, dong cua so nay
echo.
pause
