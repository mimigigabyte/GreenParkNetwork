# Favicon 图标生成说明

## 当前状态
- ✅ SVG图标已创建 (`favicon.svg`)
- ✅ 配置文件已更新 (`layout.tsx`, `manifest.json`)
- ⏳ 需要生成真实的PNG和ICO文件

## 生成真实图标的方法

### 方法1：在线工具（推荐）
1. 访问 https://realfavicongenerator.net/
2. 上传 `favicon.svg` 文件
3. 下载生成的图标包
4. 替换 `public/` 目录下的占位符文件

### 方法2：使用ImageMagick
```bash
# 安装ImageMagick后运行以下命令
magick convert favicon.svg -resize 16x16 icon-16x16.png
magick convert favicon.svg -resize 32x32 icon-32x32.png
magick convert favicon.svg -resize 192x192 icon-192x192.png
magick convert favicon.svg -resize 512x512 icon-512x512.png
magick convert favicon.svg -resize 16x16,32x32,48x48 favicon.ico
```

### 方法3：使用Node.js工具
```bash
# 安装sharp
npm install -g sharp-cli

# 生成PNG文件
sharp -i favicon.svg -o icon-16x16.png resize 16 16
sharp -i favicon.svg -o icon-32x32.png resize 32 32
sharp -i favicon.svg -o icon-192x192.png resize 192 192
sharp -i favicon.svg -o icon-512x512.png resize 512 512
```

## 图标说明
- **favicon.svg**: 矢量图标，支持任意缩放
- **favicon.ico**: 传统favicon格式，兼容性最好
- **icon-16x16.png**: 小尺寸图标，用于标签页
- **icon-32x32.png**: 标准尺寸图标
- **icon-192x192.png**: PWA图标，用于移动设备
- **icon-512x512.png**: 大尺寸PWA图标

## 设计特点
- 🎨 绿色渐变主题，符合环保理念
- 🌿 叶子图案，象征绿色技术
- ✨ 现代化设计，简洁美观
- 📱 支持多种设备和浏览器

## 测试方法
1. 启动开发服务器：`npm run dev`
2. 打开浏览器访问网站
3. 检查标签页是否显示图标
4. 在移动设备上测试PWA功能 