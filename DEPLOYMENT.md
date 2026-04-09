# 保险活动量管理 H5 应用 - 部署指南

## 项目状态

H5 应用已与小程序保持视觉和功能一致：

### 已完成功能
- ✅ 10 个活动维度填报
- ✅ 21:00 自动锁定
- ✅ AI 教练反馈
- ✅ 底部导航栏
- ✅ 首页 Dashboard
- ✅ 团队报表
- ✅ 精英排行
- ✅ 数据日历
- ✅ 实时分数计算

### 样式一致性
- ✅ 所有字体大小已转换 (1rpx = 0.5px)
- ✅ 所有间距已转换
- ✅ 所有圆角已转换
- ✅ 所有颜色已匹配

## 本地测试

### 方式 1: 直接打开
```bash
open index.html
```

### 方式 2: 使用本地服务器
```bash
# 使用 Python
python3 -m http.server 8080

# 或使用 Node.js
npx serve .
```

然后访问 `http://localhost:8080`

## 部署步骤

### 1. 准备环境

确保你有以下服务之一：
- 任何静态文件托管服务 (Vercel, Netlify, GitHub Pages)
- 带有 Nginx/Apache 的服务器
- 飞书云函数（与后端 API 一起部署）

### 2. 配置 API 地址

编辑 `js/api.js`：

```javascript
// 生产环境
const API_BASE = 'https://your-api-domain.com'  // 替换为实际 API 地址
const USE_MOCK = false
```

### 3. 部署到 Vercel (推荐)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd /Users/boo/.openclaw/workspace/insurance-activity-tool-h5-app
vercel --prod
```

### 4. 部署到服务器

```bash
# 上传文件
scp -r ./* user@server:/var/www/h5-app

# Nginx 配置示例
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/h5-app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend-api:3000;
    }
}
```

### 5. 飞书小程序集成

如果你使用飞书云函数作为后端：

1. 部署 H5 应用到可访问的 URL
2. 在飞书开发者后台配置：
   - 添加"网页应用"
   - 配置首页 URL 为 H5 应用地址
   - 配置 OAuth 回调地址

## 环境变量

部署后端 API 时需要以下环境变量：

```bash
# .env
NODE_ENV=production
PORT=3000

# AI 配置
DASHSCOPE_API_KEY=sk-xxxxx
DASHSCOPE_MODEL=qwen-plus
AI_PROVIDER=dashscope

# 飞书配置
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
FEISHU_VERIFICATION_TOKEN=xxx
```

## 定时任务配置

部署飞书云函数后，定时任务会自动执行：

| 任务 | 时间 | 说明 |
|------|------|------|
| 每日锁定 | 21:00 | 锁定当日数据 |
| AI 教练 | 21:05 | 给用户发送 AI 反馈 |
| 每日分析 | 23:00 | 生成日报 |
| 周报 | 周四 22:00 | 生成周报 |

## 测试清单

部署前请测试：

- [ ] 开屏页显示正常
- [ ] 登录功能正常
- [ ] Dashboard 显示本周总分
- [ ] 填报页 10 个维度完整
- [ ] 实时分数计算正确
- [ ] 21:00 后无法提交
- [ ] 提交后显示 AI 反馈
- [ ] 报表页显示团队数据
- [ ] 排行页显示金银铜徽章
- [ ] 底部导航可切换页面
- [ ] 所有样式与小程序一致

## 故障排查

### API 请求失败
检查 `js/api.js` 中的 `API_BASE` 是否正确配置

### 样式显示异常
清除浏览器缓存后刷新

### 21:00 锁定不生效
检查浏览器时区是否正确

### AI 教练不显示
检查是否提交了至少一项活动量

## 文件结构

```
insurance-activity-tool-h5-app/
├── index.html          # 主页面（包含所有 Vue 模板）
├── css/
│   ├── app.css        # 全局样式
│   ├── index.css      # 开屏页样式
│   ├── dashboard.css  # 首页样式
│   ├── activity.css   # 填报页样式
│   ├── report.css     # 报表页样式
│   └── ranking.css    # 排行页样式
├── js/
│   ├── api.js         # API 客户端
│   └── app.js         # Vue 应用主逻辑
├── FEATURES.md        # 功能说明
├── COMPARE.md         # 小程序对比文档
└── DEPLOYMENT.md      # 部署指南（本文件）
```

## 技术支持

遇到问题请检查：
1. 浏览器控制台错误
2. 网络请求状态
3. 后端 API 日志

## 更新日志

### v1.0.0
- 完成所有 5 个页面
- 实现 10 个活动维度
- 实现 21:00 锁定功能
- 实现 AI 教练功能
- 样式与小程序完全一致
