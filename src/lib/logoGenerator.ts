/**
 * 企业Logo自动生成工具
 */

export interface LogoGeneratorOptions {
  companyName: string;
  size?: number; // logo尺寸，默认256px
  backgroundColor?: string; // 背景色
  textColor?: string; // 文字颜色
}

/**
 * 根据企业名称生成logo
 * @param options 生成选项
 * @returns 返回生成的logo的Data URL
 */
export function generateCompanyLogo(options: LogoGeneratorOptions): Promise<string> {
  const {
    companyName,
    size = 256,
    textColor = '#ffffff'
  } = options;

  return new Promise((resolve) => {
    // 创建canvas元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建Canvas上下文');
    }

    // 设置canvas尺寸
    canvas.width = size;
    canvas.height = size;

    // 获取企业名称前四个字符
    const firstFourChars = getFirstFourChars(companyName);

    // 创建绿色背景 - 严格参考eo.jpg的绿色风格
    ctx.fillStyle = '#00b899'; // 统一为平台主绿色
    
    // 绘制圆角矩形背景
    roundRect(ctx, 0, 0, size, size, 16);
    ctx.fill();

    // 设置字体样式 - 参考eo.jpg的文字大小比例
    const fontSize = Math.floor(size / 3.5); // 更大的字体，参考图片中文字占比很大
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 计算每个字符的位置 (2x2网格) - 严格按照eo.jpg的布局
    const centerX = size / 2;
    const centerY = size / 2;
    // 参考图片中文字间距适中，不紧贴也不太分散
    const spacing = fontSize * 1.3; // 适中的间距，给文字留出呼吸空间
    const positions = [
      { x: centerX - spacing / 2, y: centerY - spacing / 2 }, // 左上
      { x: centerX + spacing / 2, y: centerY - spacing / 2 }, // 右上
      { x: centerX - spacing / 2, y: centerY + spacing / 2 }, // 左下
      { x: centerX + spacing / 2, y: centerY + spacing / 2 } // 右下
    ];

    // 绘制四个字符
    firstFourChars.forEach((char, index) => {
      if (positions[index]) {
        ctx.fillText(char, positions[index].x, positions[index].y);
      }
    });

    // 转换为Data URL
    const dataUrl = canvas.toDataURL('image/png');
    resolve(dataUrl);
  });
}

/**
 * 绘制圆角矩形
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 获取企业名称的前四个有效字符
 * 过滤掉常见的企业后缀，优先取有意义的字符
 */
function getFirstFourChars(companyName: string): string[] {
  // 移除常见的企业后缀
  const cleanName = companyName
    .replace(/(有限公司|股份有限公司|有限责任公司|集团|公司|科技|技术)$/g, '')
    .replace(/\s+/g, ''); // 移除空格

  // 如果清理后的名称长度>=4，取前4个字符
  if (cleanName.length >= 4) {
    return cleanName.slice(0, 4).split('');
  }
  
  // 如果清理后的名称不足4个字符，补充原名称的字符
  const remainingChars = companyName.replace(/\s+/g, '').slice(cleanName.length);
  const result = cleanName.split('');
  
  for (let i = 0; i < remainingChars.length && result.length < 4; i++) {
    const char = remainingChars[i];
    // 避免重复添加已有的字符
    if (!result.includes(char)) {
      result.push(char);
    }
  }
  
  // 如果仍然不足4个字符，用第一个字符填充
  while (result.length < 4 && result.length > 0) {
    result.push(result[0]);
  }
  
  return result.slice(0, 4);
}

/**
 * 将Data URL转换为File对象
 */
export function dataURLtoFile(dataURL: string, filename: string): File {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * 生成随机渐变色组合
 */
export function getRandomGradient(): { start: string; end: string } {
  const gradients = [
    { start: '#667eea', end: '#764ba2' }, // 蓝紫渐变
    { start: '#f093fb', end: '#f5576c' }, // 粉红渐变
    { start: '#4facfe', end: '#00f2fe' }, // 蓝青渐变
    { start: '#43e97b', end: '#38f9d7' }, // 绿青渐变
    { start: '#fa709a', end: '#fee140' }, // 粉黄渐变
    { start: '#a8edea', end: '#fed6e3' }, // 青粉渐变
    { start: '#ffecd2', end: '#fcb69f' }, // 橙黄渐变
    { start: '#ff9a9e', end: '#fecfef' }, // 红粉渐变
    { start: '#a18cd1', end: '#fbc2eb' }, // 紫粉渐变
    { start: '#fad0c4', end: '#ffd1ff' }  // 橙紫渐变
  ];
  
  const randomIndex = Math.floor(Math.random() * gradients.length);
  return gradients[randomIndex];
}
