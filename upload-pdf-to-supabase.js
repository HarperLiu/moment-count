// 使用此脚本将 PDF 上传到 Supabase Storage
// 运行方式: node upload-pdf-to-supabase.js

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// ============================================
// 配置区域 - 请填写您的 Supabase 信息
// ============================================
// 1. 登录 https://app.supabase.com
// 2. 选择您的项目
// 3. 点击左侧的 Settings 图标（齿轮）
// 4. 选择 API
// 5. 复制 Project URL 和 anon public key
const SUPABASE_URL = "YOUR_SUPABASE_URL"; // 例如: https://abcdefgh.supabase.co
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // 很长的一串字符
const BUCKET_NAME = "public-files"; // 您在 Storage 中创建的 bucket 名称
const FILE_NAME = "privacy.pdf"; // 上传后的文件名
// ============================================

async function uploadPDF() {
  console.log("=".repeat(60));
  console.log("📤 PDF 上传工具 - Supabase Storage");
  console.log("=".repeat(60));
  console.log();

  try {
    // 步骤 1: 验证配置
    console.log("📋 步骤 1/4: 验证配置...");
    if (SUPABASE_URL === "YOUR_SUPABASE_URL" || !SUPABASE_URL.includes("supabase")) {
      console.error("❌ 错误: SUPABASE_URL 未配置或配置错误");
      console.log("   请在脚本中替换 SUPABASE_URL 为您的项目 URL");
      console.log("   示例: https://xxxxx.supabase.co");
      process.exit(1);
    }
    
    if (SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY" || SUPABASE_ANON_KEY.length < 20) {
      console.error("❌ 错误: SUPABASE_ANON_KEY 未配置或配置错误");
      console.log("   请在脚本中替换 SUPABASE_ANON_KEY 为您的 anon public key");
      console.log("   获取方式: Dashboard > Settings > API > anon public");
      process.exit(1);
    }
    
    console.log("✅ 配置验证通过");
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    console.log();

    // 步骤 2: 初始化 Supabase 客户端
    console.log("📋 步骤 2/4: 初始化 Supabase 客户端...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ 客户端初始化成功");
    console.log();

    // 步骤 3: 读取 PDF 文件
    console.log("📋 步骤 3/4: 读取 PDF 文件...");
    const pdfPath = path.join(__dirname, "assets", "privacy.pdf");
    console.log(`   文件路径: ${pdfPath}`);

    if (!fs.existsSync(pdfPath)) {
      console.error("❌ 错误: 文件不存在");
      console.log(`   期望路径: ${pdfPath}`);
      console.log("   请确保 privacy.pdf 文件在 assets 目录中");
      process.exit(1);
    }

    const fileBuffer = fs.readFileSync(pdfPath);
    const fileSizeKB = (fileBuffer.length / 1024).toFixed(2);
    const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`✅ 文件读取成功`);
    console.log(`   大小: ${fileSizeKB} KB (${fileSizeMB} MB)`);
    console.log();

    // 步骤 4: 上传到 Supabase Storage
    console.log("📋 步骤 4/4: 上传到 Supabase Storage...");
    console.log(`   目标 Bucket: ${BUCKET_NAME}`);
    console.log(`   文件名: ${FILE_NAME}`);
    console.log("   上传中...");
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(FILE_NAME, fileBuffer, {
        contentType: "application/pdf",
        upsert: true, // 如果文件已存在则覆盖
      });

    if (error) {
      console.error("❌ 上传失败:");
      console.error(`   错误类型: ${error.name || "未知"}`);
      console.error(`   错误信息: ${error.message}`);
      
      if (error.message.includes("Bucket not found")) {
        console.log("\n💡 解决方案:");
        console.log("   1. 登录 Supabase Dashboard");
        console.log("   2. 进入 Storage 页面");
        console.log("   3. 创建一个名为 'public-files' 的 bucket");
        console.log("   4. 确保勾选 'Public bucket'");
      } else if (error.message.includes("JWT")) {
        console.log("\n💡 解决方案:");
        console.log("   1. 检查 SUPABASE_ANON_KEY 是否正确");
        console.log("   2. 确保使用的是 'anon public' key，而不是 'service_role' key");
      }
      
      process.exit(1);
    }

    console.log("✅ 上传成功!");
    console.log(`   文件路径: ${data.path}`);
    console.log();

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(FILE_NAME);

    console.log("=".repeat(60));
    console.log("🎉 完成！");
    console.log("=".repeat(60));
    console.log();
    console.log("📎 公开访问 URL:");
    console.log(urlData.publicUrl);
    console.log();
    console.log("📝 下一步:");
    console.log("   1. 复制上面的 URL");
    console.log("   2. 打开 components/AboutPage.tsx");
    console.log("   3. 找到第 20 行: const PDF_URL = \"YOUR_SUPABASE_PDF_URL_HERE\";");
    console.log("   4. 将 YOUR_SUPABASE_PDF_URL_HERE 替换为上面的 URL");
    console.log();

  } catch (error) {
    console.error("\n❌ 发生未预期的错误:");
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error("\n📋 错误堆栈:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 执行上传
uploadPDF();
