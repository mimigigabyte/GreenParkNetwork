@echo off
echo 测试华为云RDS MySQL数据库连接...
echo.

echo 连接信息:
echo 主机: 121.36.17.209
echo 端口: 14000
echo 数据库: rds-carbon_new
echo 用户名: root
echo.

echo 正在测试连接...
echo.

REM 使用telnet测试端口连通性
telnet 121.36.17.209 14000
if %errorlevel% equ 0 (
    echo ✅ 端口14000可以访问
) else (
    echo ❌ 端口14000无法访问，请检查网络连接或防火墙设置
)

echo.
echo 测试完成！
pause 