@echo off
echo ========================================
echo 华为云RDS连接测试脚本
echo ========================================

REM 设置华为云RDS环境变量
set HUAWEICLOUD_DB_URL=jdbc:mysql://your-rds-instance.huaweicloud.com:3306/your_database_name
set HUAWEICLOUD_DB_USER=root
set HUAWEICLOUD_DB_PASSWORD=your-database-password
set HUAWEICLOUD_ACCESS_KEY_ID=your-access-key-id
set HUAWEICLOUD_SECRET_ACCESS_KEY=your-secret-access-key
set HUAWEICLOUD_REGION=cn-north-4

echo 正在测试华为云RDS连接...
echo.

REM 运行连接测试
java -cp "target/classes;target/dependency/*" com.greentech.platform.config.HuaweiCloudRdsConnectionTest

echo.
echo ========================================
echo 测试完成
echo ========================================
pause 