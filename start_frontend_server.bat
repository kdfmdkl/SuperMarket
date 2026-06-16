@echo off
chcp 65001 >nul
echo ========================================================
echo  TÍCH HỢP FRONTEND VÀO API SERVER - CỔNG 5000
echo ========================================================
echo.
echo Bạn KHÔNG CẦN cài đặt Python nữa!
echo Frontend hiện tại đã được cấu hình chạy trực tiếp từ API Server.
echo.
echo Hãy chắc chắn API Server đã khởi động (chạy start_api_server.bat)
echo.
echo Điểm truy cập:
echo - Đăng nhập: http://localhost:5000/index.html
echo - Dashboard: http://localhost:5000/dashboard.html
echo.
echo Đang tự động mở trình duyệt...
start http://localhost:5000/index.html
echo.
pause

