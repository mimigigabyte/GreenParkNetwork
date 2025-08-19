# Supabase 数据库配置脚本
# 请根据你的 Supabase 项目信息修改以下变量

Write-Host "正在配置 Supabase 数据库连接..." -ForegroundColor Green

# 请替换以下值为你的 Supabase 项目信息
$PROJECT_REF = "lniapdyrbyrkhishjxqh"
$DB_PASSWORD = "Dr8sb1arf8jO2vUh"
$ANON_KEY = "your-anon-key"
$SERVICE_ROLE_KEY = "your-service-role-key"

# 设置环境变量
$env:SUPABASE_DB_URL = "jdbc:postgresql://db.$PROJECT_REF.supabase.co:5432/postgres"
$env:SUPABASE_DB_USER = "postgres"
$env:SUPABASE_DB_PASSWORD = $DB_PASSWORD
$env:SUPABASE_URL = "https://$PROJECT_REF.supabase.co"
$env:SUPABASE_ANON_KEY = $ANON_KEY
$env:SUPABASE_SERVICE_ROLE_KEY = $SERVICE_ROLE_KEY

Write-Host "环境变量设置完成！" -ForegroundColor Green
Write-Host "数据库 URL: $env:SUPABASE_DB_URL" -ForegroundColor Yellow
Write-Host "Supabase URL: $env:SUPABASE_URL" -ForegroundColor Yellow

Write-Host "`n现在可以运行以下命令启动应用程序：" -ForegroundColor Cyan
Write-Host "mvn spring-boot:run -Dspring.profiles.active=dev" -ForegroundColor White