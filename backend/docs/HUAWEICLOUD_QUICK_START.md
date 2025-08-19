# 华为云RDS快速启动指南

## 🚀 快速开始

### 1. 环境准备

确保您的开发环境已安装：
- Java 17+
- Maven 3.6+
- 华为云RDS MySQL实例

### 2. 配置环境变量

创建 `.env` 文件或在系统环境变量中设置：

```bash
# 华为云RDS连接配置
HUAWEICLOUD_DB_URL=jdbc:mysql://your-rds-instance.huaweicloud.com:3306/your_database_name
HUAWEICLOUD_DB_USER=root
HUAWEICLOUD_DB_PASSWORD=your-database-password

# 华为云认证信息
HUAWEICLOUD_ACCESS_KEY_ID=your-access-key-id
HUAWEICLOUD_SECRET_ACCESS_KEY=your-secret-access-key
HUAWEICLOUD_REGION=cn-north-4
```

### 3. 启动应用

```bash
# 进入后端目录
cd backend

# 使用华为云配置启动
mvn spring-boot:run -Dspring.profiles.active=huaweicloud
```

### 4. 测试连接

#### 方法一：使用测试脚本

```bash
# Windows
test-huaweicloud-rds.bat

# Linux/Mac
./test-huaweicloud-rds.sh
```

#### 方法二：使用REST API

启动应用后，访问以下端点：

```bash
# 测试连接
curl http://localhost:8080/api/huaweicloud/rds/test-connection

# 获取连接池状态
curl http://localhost:8080/api/huaweicloud/rds/pool-status

# 健康检查
curl http://localhost:8080/api/huaweicloud/rds/health
```

#### 方法三：使用Maven测试

```bash
mvn test -Dtest=HuaweiCloudRdsConnectionTest
```

### 5. 验证成功

成功连接后，您应该看到类似输出：

```json
{
  "success": true,
  "queryTestPassed": true,
  "databaseProductName": "MySQL",
  "databaseVersion": "8.0.28",
  "url": "jdbc:mysql://your-rds-instance.huaweicloud.com:3306/your_database_name"
}
```

## 🔧 常见问题

### Q: 连接超时怎么办？
A: 检查以下配置：
- 安全组是否开放3306端口
- 网络连通性是否正常
- RDS实例状态是否正常

### Q: 认证失败怎么办？
A: 检查以下配置：
- 用户名和密码是否正确
- 数据库权限设置
- SSL配置是否正确

### Q: 如何切换回Supabase？
A: 使用以下命令启动：
```bash
mvn spring-boot:run -Dspring.profiles.active=dev
```

## 📊 监控端点

应用启动后，可以通过以下端点监控数据库状态：

- `/api/huaweicloud/rds/status` - 完整状态信息
- `/api/huaweicloud/rds/pool-status` - 连接池状态
- `/api/huaweicloud/rds/health` - 健康检查

## 🔒 安全建议

1. **使用强密码**：设置复杂的数据库密码
2. **限制访问IP**：在安全组中只允许必要的IP访问
3. **启用SSL**：配置SSL连接加密数据传输
4. **定期备份**：设置自动备份策略
5. **监控告警**：配置RDS监控和告警

## 📚 更多信息

- 详细配置指南：[HUAWEICLOUD_RDS_SETUP.md](./HUAWEICLOUD_RDS_SETUP.md)
- 华为云RDS官方文档：[https://support.huaweicloud.com/rds/](https://support.huaweicloud.com/rds/)
- 项目文档：[README.md](../../README.md) 