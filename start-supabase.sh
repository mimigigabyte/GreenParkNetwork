#!/bin/bash

echo "启动绿色技术平台 - Supabase 版本"
echo "================================"

echo ""
echo "设置环境变量..."
export SPRING_PROFILES_ACTIVE=supabase
export NEXT_PUBLIC_USE_SUPABASE=true
export NEXT_PUBLIC_USE_MOCK=false
export SUPABASE_URL=https://qpeanozckghazlzzhrni.supabase.co
export SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODU4NTAsImV4cCI6MjA2OTg2MTg1MH0.LaJALEd_KP6LLaKEjRo7zuwjCA6Bbt_2QpSWPmbyw1I
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8
export SUPABASE_JWT_SECRET=Ccnv371q3wHF7dBIMOiY5IzXzqm3mWw8yb1jyVTIx+MnopCKEELSRdoQs/oaO7KxkXrqBFvhuXR0v6nf/GsPKg==
export SUPABASE_DB_PASSWORD=Dr8sb1arf8jO2vUh

echo ""
echo "启动后端服务..."
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=supabase &
BACKEND_PID=$!

echo ""
echo "等待后端启动..."
sleep 10

echo ""
echo "启动前端服务..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "服务启动完成！"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:8080"
echo "API文档: http://localhost:8080/api/swagger-ui.html"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait