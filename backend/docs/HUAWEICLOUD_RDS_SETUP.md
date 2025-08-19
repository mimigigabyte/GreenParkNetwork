# 华为云RDS连接配置指南

本文档介绍如何在绿色技术平台项目中配置华为云RDS数据库连接。

## 1. 华为云RDS实例准备

### 1.1 创建RDS实例
1. 登录华为云控制台
2. 进入RDS服务
3. 创建MySQL实例
4. 选择合适的规格和存储
5. 设置管理员密码

### 1.2 配置安全组
1. 在RDS实例详情页面，点击"安全组"
2. 添加入方向规则：
   - 协议：TCP
   - 端口：3306
   - 源地址：应用服务器IP或0.0.0.0/0（开发环境）

### 1.3 获取连接信息
- 内网地址：`your-rds-instance.huaweicloud.com`
- 端口：3306
- 数据库名：`your_database_name`
- 用户名：`root`
- 密码：创建实例时设置的密码

## 2. 环境变量配置

### 2.1 必需的环境变量

```bash
# 数据库连接配置
HUAWEICLOUD_DB_URL=jdbc:mysql://your-rds-instance.huaweicloud.com:3306/your_database_name
HUAWEICLOUD_DB_USER=root
HUAWEICLOUD_DB_PASSWORD=your-database-password

# 华为云认证信息
HUAWEICLOUD_ACCESS_KEY_ID=your-access-key-id
HUAWEICLOUD_SECRET_ACCESS_KEY=your-secret-access-key
HUAWEICLOUD_REGION=cn-north-4

# RDS实例信息
HUAWEICLOUD_RDS_INSTANCE_ID=your-rds-instance-id
HUAWEICLOUD_DB_NAME=your_database_name
HUAWEICLOUD_DB_PORT=3306
```

### 2.2 可选的环境变量

```bash
# Redis配置（如果使用华为云DCS）
HUAWEICLOUD_REDIS_HOST=your-dcs-instance.huaweicloud.com
HUAWEICLOUD_REDIS_PORT=6379
HUAWEICLOUD_REDIS_PASSWORD=your-redis-password
HUAWEICLOUD_DCS_INSTANCE_ID=your-dcs-instance-id
```

## 3. 应用配置

### 3.1 激活华为云配置

在启动应用时，使用以下命令激活华为云配置：

```bash
# 使用华为云配置启动
java -jar your-app.jar --spring.profiles.active=huaweicloud

# 或者设置环境变量
export SPRING_PROFILES_ACTIVE=huaweicloud
java -jar your-app.jar
```

### 3.2 配置文件说明

- `application-huaweicloud.yml`：华为云RDS专用配置文件
- `HuaweiCloudRdsConfig.java`：数据源配置类
- `HuaweiCloudRdsConnectionTest.java`：连接测试类

## 4. 连接测试

### 4.1 使用测试脚本

```bash
# Windows
test-huaweicloud-rds.bat

# Linux/Mac
./test-huaweicloud-rds.sh
```

### 4.2 手动测试

```bash
# 编译项目
mvn clean compile

# 运行测试
mvn test -Dtest=HuaweiCloudRdsConnectionTest
```

### 4.3 连接验证

成功连接后，您应该看到类似输出：

```
✅ 华为云RDS连接测试成功！
数据库URL: jdbc:mysql://your-rds-instance.huaweicloud.com:3306/your_database_name
数据库产品: MySQL
数据库版本: 8.0.28
```

## 5. 性能优化配置

### 5.1 连接池优化

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10          # 最大连接数
      minimum-idle: 5                # 最小空闲连接
      connection-timeout: 20000      # 连接超时（毫秒）
      idle-timeout: 300000           # 空闲超时（毫秒）
      max-lifetime: 1200000          # 最大生命周期（毫秒）
      leak-detection-threshold: 60000 # 连接泄漏检测阈值
      validation-timeout: 5000       # 验证超时（毫秒）
```

### 5.2 JPA优化

```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 20             # 批处理大小
          fetch_size: 50             # 获取大小
        connection:
          provider_disables_autocommit: true
```

## 6. 监控和日志

### 6.1 启用详细日志

```yaml
logging:
  level:
    com.zaxxer.hikari: DEBUG        # 连接池日志
    org.springframework.jdbc: DEBUG  # JDBC日志
    org.hibernate.SQL: DEBUG         # SQL日志
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

### 6.2 连接池监控

应用启动后，可以通过以下方式监控连接池：

```java
@Autowired
private DataSource dataSource;

// 获取连接池状态
if (dataSource instanceof HikariDataSource) {
    HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
    System.out.println("活跃连接数: " + hikariDataSource.getHikariPoolMXBean().getActiveConnections());
    System.out.println("空闲连接数: " + hikariDataSource.getHikariPoolMXBean().getIdleConnections());
}
```

## 7. 故障排除

### 7.1 常见问题

1. **连接超时**
   - 检查安全组配置
   - 验证网络连通性
   - 确认RDS实例状态

2. **认证失败**
   - 验证用户名和密码
   - 检查数据库权限设置
   - 确认SSL配置

3. **连接池耗尽**
   - 增加最大连接数
   - 检查连接泄漏
   - 优化SQL查询

### 7.2 调试命令

```bash
# 测试网络连通性
telnet your-rds-instance.huaweicloud.com 3306

# 使用MySQL客户端测试
mysql -h your-rds-instance.huaweicloud.com -u root -p -P 3306
```

## 8. 安全建议

1. **使用强密码**：设置复杂的数据库密码
2. **限制访问IP**：在安全组中只允许必要的IP访问
3. **启用SSL**：配置SSL连接加密数据传输
4. **定期备份**：设置自动备份策略
5. **监控告警**：配置RDS监控和告警

## 9. 成本优化

1. **选择合适的规格**：根据实际需求选择CPU和内存
2. **存储优化**：选择合适的存储类型和大小
3. **备份策略**：合理设置备份保留期
4. **监控使用量**：定期检查资源使用情况

## 10. 迁移指南

### 从其他数据库迁移

1. **数据导出**：从原数据库导出数据
2. **格式转换**：转换为MySQL兼容格式
3. **数据导入**：导入到华为云RDS
4. **应用配置**：更新应用配置指向新数据库
5. **测试验证**：全面测试应用功能

### 从本地数据库迁移

1. **创建RDS实例**：在华为云创建RDS实例
2. **数据迁移**：使用mysqldump或其他工具迁移数据
3. **更新配置**：修改应用配置
4. **切换测试**：在测试环境验证
5. **生产切换**：在生产环境切换数据库连接 