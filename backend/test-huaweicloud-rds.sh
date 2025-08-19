#!/bin/bash

echo "========================================"
echo "华为云RDS连接测试脚本"
echo "========================================"

# 设置华为云RDS环境变量
export HUAWEICLOUD_DB_URL="jdbc:mysql://your-rds-instance.huaweicloud.com:3306/your_database_name"
export HUAWEICLOUD_DB_USER="root"
export HUAWEICLOUD_DB_PASSWORD="your-database-password"
export HUAWEICLOUD_ACCESS_KEY_ID="your-access-key-id"
export HUAWEICLOUD_SECRET_ACCESS_KEY="your-secret-access-key"
export HUAWEICLOUD_REGION="cn-north-4"

echo "正在测试华为云RDS连接..."
echo

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "❌ 错误: 未找到Java环境，请先安装Java"
    exit 1
fi

# 检查Maven环境
if ! command -v mvn &> /dev/null; then
    echo "❌ 错误: 未找到Maven环境，请先安装Maven"
    exit 1
fi

# 编译项目
echo "正在编译项目..."
mvn clean compile -q

if [ $? -ne 0 ]; then
    echo "❌ 编译失败，请检查项目配置"
    exit 1
fi

# 运行连接测试
echo "正在运行连接测试..."
mvn test -Dtest=HuaweiCloudRdsConnectionTest -q

if [ $? -eq 0 ]; then
    echo
    echo "✅ 华为云RDS连接测试成功！"
else
    echo
    echo "❌ 华为云RDS连接测试失败，请检查配置"
fi

echo
echo "========================================"
echo "测试完成"
echo "========================================" 