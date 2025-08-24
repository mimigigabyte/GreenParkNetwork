# 本地环境 Turnstile 验证跳过说明

## 功能概述
系统已自动配置本地开发环境跳过 Cloudflare Turnstile 人机验证，无需手动配置。

## 自动检测条件
系统将在以下情况下自动跳过 Turnstile 验证：

### 服务端环境检测
- `NODE_ENV=development`
- 非 Vercel 部署环境（`VERCEL !== '1'`）
- 未设置 Turnstile 密钥环境变量

### 客户端环境检测
- hostname 为：`localhost`, `127.0.0.1`, `0.0.0.0`, `::1`
- 域名以 `.local` 结尾
- 使用常见开发端口：`3000`, `3001`, `8000`, `8080`, `5173`, `5174`
- 内网 IP 地址段：`192.168.x.x`, `10.x.x.x`, `172.x.x.x`

## 环境变量配置（可选）

### 强制跳过验证
```bash
# .env.local
SKIP_TURNSTILE_IN_DEV=true
```

### 生产环境必需变量
```bash
# .env.local (生产环境)
TURNSTILE_SECRET_KEY=your-secret-key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
```

## 视觉提示
在本地环境下，Turnstile 组件将显示绿色提示框："本地开发环境 - 已自动跳过人机验证"

## 安全说明
- 此跳过机制仅在确认的本地开发环境中生效
- 生产环境将始终执行 Turnstile 验证
- 系统会在控制台输出环境检测信息用于调试

## 相关文件
- `/src/lib/environment.ts` - 环境检测逻辑
- `/src/lib/turnstile-verification.ts` - 验证跳过处理
- `/src/components/auth/turnstile-widget.tsx` - UI 跳过提示
- API 路由中的验证逻辑自动应用跳过机制