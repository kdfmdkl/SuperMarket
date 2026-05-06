@echo off
chcp 65001 >nul
echo ===========================================
echo  KHOI DONG API SERVER - SuperMarketMini
echo ===========================================
echo.
echo Dang build project...
cd /d D:\SuperMakretMini\SuperMarketMini\SuperMarketMini
dotnet build --verbosity quiet
if %errorlevel% neq 0 (
    echo.
    echo [LOI] Build that bai!
    pause
    exit /b 1
)
echo [OK] Build thanh cong
echo.
echo Dang khoi dong server...
echo API se chay tai: http://localhost:5000
echo Swagger UI: http://localhost:5000/swagger
echo.
echo Nhan Ctrl+C de dung server
echo ===========================================
dotnet run --urls "http://localhost:5000"
