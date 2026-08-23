@echo off
chcp 65001 >nul
title HE THONG QUAN LY VLXD PRO v2.0
echo =========================================================
echo       HỆ THỐNG QUẢN LÝ CỬA HÀNG VẬT LIỆU XÂY DỰNG
echo =========================================================
echo.
echo [1/3] Đang khởi động Cơ sở dữ liệu PostgreSQL (Port 5433)...
start /b "" "C:\Program Files\PostgreSQL\16\bin\postgres.exe" -D "%~dp0pgdata" >nul 2>&1
timeout /t 2 >nul

echo [2/3] Đang khởi động Máy chủ Ứng dụng Full-Stack...
start /b npx pnpm dev >nul 2>&1
timeout /t 3 >nul

echo.
echo =========================================================
echo  ✅ HỆ THỐNG ĐÃ SẴN SÀNG!
echo  👉 Link truy cập Online: Đang kết nối Cloudflare Tunnel...
echo =========================================================
echo.

"%~dp0cloudflared.exe" tunnel --url http://localhost:5173
