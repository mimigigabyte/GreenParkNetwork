# 开发命令

## 前端 (Next.js)
- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm start` - 启动生产服务器
- `npm run lint` - 运行ESLint代码检查

## 后端 (Spring Boot)
- `mvn spring-boot:run` - 启动Spring Boot应用
- `mvn clean install` - 编译和打包应用
- `mvn test` - 运行单元测试
- `mvn package` - 创建可执行JAR

## 数据库操作
- Supabase: 默认开发数据库 (PostgreSQL)
- HuaweiCloud RDS: 生产数据库 (MySQL)
- 使用`spring.profiles.active=huaweicloud`激活生产配置

## 任务完成后运行的命令
1. `npm run lint` - 检查前端代码质量
2. `npm run build` - 验证构建是否成功
3. 如果修改了后端代码: `mvn test` - 运行测试