const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * 自动定时导入剩余日本技术数据
 * 每分钟导入一条，从第4条开始（索引3）
 */

class AutoImporter {
  constructor() {
    this.startIndex = 3; // 从第4条开始
    this.currentIndex = this.startIndex;
    this.totalItems = 0;
    this.successCount = 0;
    this.failCount = 0;
    this.interval = 60000; // 60秒间隔
    this.maxRetries = 1; // 失败后重试1次
    this.logFile = path.join(__dirname, `import-log-${Date.now()}.txt`);
    this.isRunning = false;
  }

  // 记录日志
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  // 获取总数据量
  getTotalItems() {
    try {
      const dataPath = path.join(__dirname, 'data', 'japanese-tech-database.json');
      const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      this.totalItems = jsonData.technologies.length;
      return this.totalItems;
    } catch (error) {
      this.log(`读取数据文件失败: ${error.message}`, 'ERROR');
      return 0;
    }
  }

  // 导入单条数据
  async importSingle(index, retryCount = 0) {
    return new Promise((resolve) => {
      this.log(`\n🚀 开始导入第 ${index + 1} 条数据 (索引: ${index})${retryCount > 0 ? ` [重试 ${retryCount}]` : ''}`);
      
      const child = spawn('node', ['import-single-tech.js', index.toString()], {
        stdio: 'pipe',
        cwd: __dirname
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        // 实时显示重要信息
        if (text.includes('技术名称:') || text.includes('✅ 技术导入成功') || text.includes('⚠')) {
          console.log(text.trim());
        }
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 && output.includes('✅ 技术导入成功')) {
          this.successCount++;
          this.log(`✅ 第 ${index + 1} 条数据导入成功`, 'SUCCESS');
          resolve({ success: true, output });
        } else {
          this.log(`❌ 第 ${index + 1} 条数据导入失败 (退出码: ${code})`, 'ERROR');
          this.log(`错误输出: ${errorOutput}`, 'ERROR');
          
          // 重试机制
          if (retryCount < this.maxRetries) {
            this.log(`🔄 准备重试第 ${index + 1} 条数据`, 'WARN');
            setTimeout(() => {
              this.importSingle(index, retryCount + 1).then(resolve);
            }, 10000); // 10秒后重试
          } else {
            this.failCount++;
            resolve({ success: false, output, error: errorOutput });
          }
        }
      });
    });
  }

  // 显示进度
  showProgress() {
    const processed = this.successCount + this.failCount;
    const remaining = this.totalItems - this.currentIndex;
    const progress = ((this.currentIndex - this.startIndex) / (this.totalItems - this.startIndex) * 100).toFixed(1);
    
    this.log(`\n📊 导入进度统计:`);
    this.log(`   当前进度: ${this.currentIndex - this.startIndex}/${this.totalItems - this.startIndex} (${progress}%)`);
    this.log(`   成功: ${this.successCount} 条`);
    this.log(`   失败: ${this.failCount} 条`);
    this.log(`   剩余: ${remaining} 条`);
    
    if (remaining > 0) {
      const estimatedTime = Math.ceil(remaining * this.interval / 1000 / 60);
      this.log(`   预计剩余时间: ${estimatedTime} 分钟`);
    }
  }

  // 主导入循环
  async startImport() {
    if (this.isRunning) {
      this.log('导入任务已在运行中', 'WARN');
      return;
    }

    this.isRunning = true;
    this.log('🚀 开始自动定时导入任务');
    this.log(`📋 配置信息:`);
    this.log(`   起始索引: ${this.startIndex}`);
    this.log(`   总数据量: ${this.totalItems}`);
    this.log(`   导入间隔: ${this.interval / 1000} 秒`);
    this.log(`   日志文件: ${this.logFile}`);

    try {
      for (let i = this.currentIndex; i < this.totalItems; i++) {
        this.currentIndex = i;
        
        // 导入当前数据
        const result = await this.importSingle(i);
        
        // 显示进度
        this.showProgress();
        
        // 如果不是最后一条，等待间隔时间
        if (i < this.totalItems - 1) {
          this.log(`⏰ 等待 ${this.interval / 1000} 秒后导入下一条...`);
          await this.sleep(this.interval);
        }
      }

      // 导入完成
      this.isRunning = false;
      this.showFinalReport();

    } catch (error) {
      this.log(`❌ 导入任务异常终止: ${error.message}`, 'ERROR');
      this.isRunning = false;
    }
  }

  // 最终报告
  showFinalReport() {
    this.log('\n🎉 自动导入任务完成！');
    this.log(`\n📈 最终统计:`);
    this.log(`   总数据量: ${this.totalItems} 条`);
    this.log(`   成功导入: ${this.successCount} 条`);
    this.log(`   失败: ${this.failCount} 条`);
    this.log(`   成功率: ${((this.successCount / (this.totalItems - this.startIndex)) * 100).toFixed(1)}%`);
    this.log(`   总耗时: ${Math.ceil((Date.now() - this.startTime) / 1000 / 60)} 分钟`);
    this.log(`   详细日志: ${this.logFile}`);

    if (this.failCount > 0) {
      this.log(`\n⚠️  有 ${this.failCount} 条数据导入失败，请检查日志文件获取详细信息`, 'WARN');
    } else {
      this.log('\n✅ 所有数据导入成功！', 'SUCCESS');
    }
  }

  // 暂停函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 停止导入（优雅退出）
  stop() {
    this.log('📛 收到停止信号，等待当前导入完成后退出...', 'WARN');
    this.isRunning = false;
  }
}

// 主程序
async function main() {
  const importer = new AutoImporter();
  
  // 获取总数据量
  const totalItems = importer.getTotalItems();
  if (totalItems === 0) {
    console.log('❌ 无法读取数据文件，程序退出');
    process.exit(1);
  }

  // 记录开始时间
  importer.startTime = Date.now();

  // 处理优雅退出
  process.on('SIGINT', () => {
    console.log('\n收到 Ctrl+C 信号...');
    importer.stop();
  });

  process.on('SIGTERM', () => {
    console.log('\n收到终止信号...');
    importer.stop();
  });

  // 开始导入
  await importer.startImport();
}

// 运行程序
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 程序异常:', error);
    process.exit(1);
  });
}

module.exports = AutoImporter;