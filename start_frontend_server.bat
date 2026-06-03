@echo off
echo Starting frontend development server...
echo.
echo Server will run at: http://localhost:8080
echo.
echo Access points:
echo - Login: http://localhost:8080/index.html
echo - Dashboard: http://localhost:8080/dashboard.html
echo.
cd /d E:\SuperMarket\SuperMarketMini\frontend
python -m http.server 8080
pause
