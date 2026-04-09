# H5 网页应用部署指南

## 应用结构

```
insurance-activity-tool-h5-app/
├── index.html          # 主页面
├── css/
│   ├── app.css         # 全局样式
│   ├── index.css       # 开屏页样式
│   ├── dashboard.css   # 首页样式
│   ├── activity.css    # 填报页样式
│   ├── report.css      # 报表页样式
│   └── ranking.css     # 排行页样式
└── js/
    ├── api.js          # API 接口模块
    └── app.js          # Vue 应用主文件
```

## 部署到飞书后台

### 步骤 1: 在飞书开放平台创建网页应用

1. 访问 https://open.feishu.cn
2. 扫码登录
3. 点击「创建应用」或进入现有应用
4. 应用类型选择「网页应用」

### 步骤 2: 配置应用首页地址

1. 进入应用管理页面
2. 找到「网页应用」或「应用首页」配置
3. 设置首页 URL：
   - 开发测试：使用本地隧道工具（如 ngrok）
   - 生产环境：使用正式服务器地址

### 步骤 3: 部署前端文件

#### 方案 A: 部署到飞书云存储（推荐）

1. 在飞书开发者工具中
2. 上传所有文件到云存储
3. 获取公开访问链接

#### 方案 B: 部署到外部服务器

```bash
# 1. 购买云服务器（阿里云/腾讯云等）
# 2. 上传文件
scp -r insurance-activity-tool-h5-app/* root@服务器 IP:/var/www/html/

# 3. 配置 Nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 方案 C: 使用免费托管（适合测试）

**Vercel:**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd insurance-activity-tool-h5-app
vercel
```

**Netlify:**
```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
cd insurance-activity-tool-h5-app
netlify deploy --prod
```

### 步骤 4: 配置飞书应用入口

1. 在飞书开放平台
2. 应用管理 → 网页应用
3. 设置「应用首页 URL」为你的部署地址
4. 设置「应用可见范围」

### 步骤 5: 配置 OAuth 登录（可选）

如果需要飞书登录：

1. 在飞书开放平台获取 App ID 和 App Secret
2. 修改 `js/api.js` 中的登录逻辑
3. 添加飞书 OAuth 回调处理

```javascript
// 飞书 OAuth 登录
async function handleLogin() {
  const appId = 'cli_a95a6b370af8dcc8'
  const redirectUri = encodeURIComponent(window.location.origin + '/callback')
  const authUrl = `https://open.feishu.cn/open-apis/authen/v1/index?app_id=${appId}&redirect_uri=${redirectUri}`
  window.location.href = authUrl
}
```

## 本地测试

### 方法 1: Python 简单服务器

```bash
cd insurance-activity-tool-h5-app
python3 -m http.server 8080
# 访问 http://localhost:8080
```

### 方法 2: Node.js 服务器

```bash
cd insurance-activity-tool-h5-app
npx serve
# 访问 http://localhost:3000
```

### 方法 3: VS Code Live Server

1. 安装 Live Server 扩展
2. 右键 index.html → Open with Live Server

## API 配置

当前使用模拟数据，对接真实后端时修改 `js/api.js`:

```javascript
const API_BASE = 'https://your-backend-url.com'

const api = {
  async getUserInfo() {
    const response = await fetch(`${API_BASE}/api/user/info`)
    return await response.json()
  },
  // ... 其他方法
}
```

## 移动端适配

应用已配置移动端适配：
-  viewport 设置禁止缩放
-  使用 rem/px 适配各种屏幕
-  触摸反馈效果
-  安全区域适配（iPhone 刘海屏）

## 主题色

阳光柠檬黄主题：
- 主色：#FACC15
- 浅色：#FDE047
- 辅助色：#FEF3C7

## 功能清单

- [x] 开屏页（登录）
- [x] Dashboard 首页
  - [x] 本周总分
  - [x] 数据日历
  - [x] 已填报项目
- [x] 填报页
  - [x] 6 个维度计数
  - [x] 实时分数计算
  - [x] 提交确认
- [x] 报表页
  - [x] 团队统计卡片
  - [x] 各维度汇总
  - [x] 进度条
- [x] 排行页
  - [x] 金银铜徽章
  - [x] 排行榜列表
- [x] 底部导航

## 后续优化

1. **接入真实后端 API**
2. **添加 loading 状态**
3. **错误处理和重试**
4. **离线缓存（PWA）**
5. **数据导出功能**
6. **AI 教练集成**

## 常见问题

### Q: 飞书后台看不到网页应用选项？
A: 确保应用类型支持网页应用，或创建新应用时选择网页应用类型。

### Q: 如何在飞书工作台中显示？
A: 在应用管理 → 工作台配置中添加应用图标和入口。

### Q: 数据如何持久化？
A: 当前使用 localStorage 缓存用户信息，活动数据需要对接后端 API。

### Q: 如何添加更多活动维度？
A: 修改 `js/app.js` 中的 `DIMENSIONS` 数组。
