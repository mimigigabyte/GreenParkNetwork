@echo off
echo 启动绿色技术平台 - Supabase 版本
echo ================================

echo.
echo 设置环境变量...
set SPRING_PROFILES_ACTIVE=supabase
set NEXT_PUBLIC_USE_SUPABASE=true
set NEXT_PUBLIC_USE_MOCK=false
set SUPABASE_URL=https://qpeanozckghazlzzhrni.supabase.co
set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODU4NTAsImV4cCI6MjA2OTg2MTg1MH0.LaJALEd_KP6LLaKEjRo7zuwjCA6Bbt_2QpSWPmbyw1I
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8
set SUPABASE_JWT_SECRET=Ccnv371q3wHF7dBIMOiY5IzXzqm3mWw8yb1jyVTIx+MnopCKEELSRdoQs/oaO7KxkXrqBFvhuXR0v6nf/GsPKg==
set SUPABASE_DB_PASSWORD=Dr8sb1arf8jO2vUh

echo.
echo 启动后端服务...
cd backend
start cmd /k "mvn spring-boot:run -Dspring-boot.run.profiles=supabase"

echo.
echo 等待后端启动...
timeout /t 10 /nobreak

echo.
echo 启动前端服务...
cd ..
start cmd /k "npm run dev"

echo.
echo 服务启动完成！
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:8080
echo API文档: http://localhost:8080/api/swagger-ui.html
echo.
pause