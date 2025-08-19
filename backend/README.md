# 绿色技术平台后端服务

基于Spring Boot 3的企业级后端API服务，为绿色技术平台提供完整的后端支持。

## 技术栈

- **框架**: Spring Boot 3.2.5
- **语言**: Java 17
- **数据库**: PostgreSQL (Supabase)
- **缓存**: Redis (Upstash)
- **认证**: Supabase Auth + JWT
- **支付**: Stripe + 微信支付
- **邮件**: Resend
- **AI服务**: OpenRouter
- **文档**: SpringDoc OpenAPI 3
- **构建工具**: Maven

## 项目结构

```text
backend/
├── src/
│   ├── main/
│   │   ├── java/com/greentech/platform/
│   │   │   ├── GreenTechPlatformApplication.java  # 主启动类
│   │   │   ├── controller/                        # 控制器层
│   │   │   │   └── HealthController.java         # 健康检查控制器
│   │   │   ├── service/                          # 服务层
│   │   │   ├── repository/                       # 数据访问层
│   │   │   ├── entity/                           # 实体类
│   │   │   ├── dto/                              # 数据传输对象
│   │   │   ├── config/                           # 配置类
│   │   │   │   ├── WebConfig.java               # Web配置
│   │   │   │   └── SecurityConfig.java          # 安全配置
│   │   │   └── common/                           # 通用工具类
│   │   │       └── ApiResponse.java             # 统一响应格式
│   │   └── resources/
│   │       └── application.yml                   # 应用配置文件
│   └── test/                                     # 测试代码
├── pom.xml                                       # Maven配置
├── Dockerfile                                    # Docker配置
└── README.md                                     # 项目说明
```

## 快速开始

### 环境要求

- Java 17+
- Maven 3.6+
- PostgreSQL 13+ (或使用Supabase)
- Redis (或使用Upstash)

### 本地开发

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   # 编辑.env文件，填入实际的配置值
   ```

3. **安装依赖**
   ```bash
   mvn clean install
   ```

4. **启动应用**
   ```bash
   mvn spring-boot:run
   ```

5. **验证运行**
   - 健康检查: http://localhost:8080/api/health
   - API文档: http://localhost:8080/swagger-ui.html

### Docker部署

1. **构建镜像**
   ```bash
   docker build -t greentech-platform-backend .
   ```

2. **运行容器**
   ```bash
   docker run -p 8080:8080 \
     -e SUPABASE_DB_URL=your_db_url \
     -e SUPABASE_DB_USER=your_user \
     -e SUPABASE_DB_PASSWORD=your_password \
     greentech-platform-backend
   ```

## API文档

启动应用后，可以通过以下地址访问API文档：

- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api-docs

## 环境配置

### 开发环境 (dev)
- 数据库DDL自动更新
- 详细日志输出
- 开发工具热重载

### 生产环境 (prod)
- 数据库DDL验证模式
- 精简日志输出
- 性能优化配置

## 核心功能

- [x] 健康检查API
- [x] 统一响应格式
- [x] CORS跨域配置
- [x] Spring Security基础配置
- [x] Swagger API文档
- [ ] 用户认证与授权
- [ ] 支付集成
- [ ] 邮件服务
- [ ] AI服务集成

## 开发规范

- 遵循阿里巴巴Java开发手册
- 使用Spring Boot最佳实践
- 统一的异常处理
- 完整的单元测试覆盖
- 详细的API文档注释

## 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

Copyright (c) 2024 绿色技术平台. All rights reserved.