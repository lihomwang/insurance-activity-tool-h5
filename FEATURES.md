# 保险活动量管理工具 - H5 网页应用功能说明

## 核心功能

### 1. 活动量填报

**页面**: `index.html` (填报页)

**功能**:
- 10 个活动维度填报
- 实时分数计算
- 21:00 自动锁定（晚上 9 点后无法提交）
- 提交后 AI 教练反馈

**维度列表**:
| 维度 | 图标 | 分值 |
|------|------|------|
| 新增准客户 | 📝 | 1 分/次 |
| 转介绍 | 🌟 | 3 分/次 |
| 邀约 | 📅 | 1 分/次 |
| 销售面谈 | 💼 | 10 分/次 |
| 增员面谈 | 👥 | 10 分/次 |
| 事业项目书 | 📄 | 1 分/次 |
| 成交 | 🎉 | 10 分/次 |
| 嘉宾参加 EOP | 🎪 | 5 分/次 |
| CC 测评 | 📊 | 5 分/次 |
| 送训 | 📚 | 10 分/次 |

### 2. 首页 Dashboard

**页面**: `index.html` (首页)

**显示内容**:
- 本周总分卡片
- 本周已填报次数
- 数据日历（本周 7 天）
- 已填报项目列表

### 3. 团队报表

**页面**: `index.html` (报表页)

**显示内容**:
- 成员总数
- 人均分数
- 总活动分
- 本周之星
- 各维度活动汇总（带进度条）

### 4. 精英排行

**页面**: `index.html` (排行页)

**显示内容**:
- 排行榜（前 3 名金银铜徽章）
- 第 1 名皇冠标识
- 分数颜色区分

## 定时任务

### 后端定时任务（飞书云函数）

| 任务 | 执行时间 | 说明 |
|------|----------|------|
| 每日锁定 | 每天 21:00 | 锁定当日数据，无法再提交 |
| AI 教练 | 每天 21:05 | 给未提交/已提交用户发送 AI 教练问题 |
| 每日分析 | 每天 23:00 | 生成每日数据分析报告 |
| 每周报告 | 每周四 22:00 | 生成周报发送给管理员 |

### 前端锁定检查

```javascript
// 每分钟检查一次锁定状态
setInterval(() => {
  if (window.vueApp) {
    window.vueApp.checkLockStatus()
  }
}, 60000)
```

**锁定逻辑**:
```javascript
function isLockedTime() {
  const hour = new Date().getHours()
  return hour >= 21  // 21:00 后锁定
}
```

## AI 教练功能

### 工作流程

1. **用户提交活动量** → 触发 AI 教练
2. **分析用户数据** → 生成个性化问题
3. **显示反馈** → 弹窗显示总结 + 问题

### AI 教练规则

```javascript
function generateAiQuestions(userData) {
  // 零数据
  if (userData.totalScore === 0) {
    '今天还没有活动量数据哦～是遇到什么困难了吗？'
    '记得每天都要填报活动量，这是赚钱的第一步！'
  }

  // 有成交
  if (userData.dealCount > 0) {
    `恭喜成交 ${userData.dealCount} 单！🎉 能分享一下成交的秘诀吗？`
  }

  // 有面谈
  if (userData.salesMeetingCount > 0) {
    `今天面谈了 ${userData.salesMeetingCount} 位客户，感觉如何？有什么收获？`
  }

  // 准客户少
  if (userData.newLeadsCount < 3) {
    '准客户新增有点少哦，明天要不要多开发几个新客户？'
  }

  // 通用问题
  '明天有什么计划？需要我帮你制定一个目标吗？'
}
```

### 后端 AI 教练（飞书机器人）

后端通过飞书机器人发送私信：

```javascript
// services/aiCoach.js
async function startAICoachConversations() {
  // 1. 获取今日未提交用户
  // 2. 获取已提交用户
  // 3. 调用 AI 生成问题
  // 4. 通过飞书机器人发送私信
}
```

## 21:00 截止流程

```
20:59:59 - 用户还可以提交今日活动量
21:00:00 - 前端检查锁定，显示提示
21:00:01 - 后端定时任务执行锁定
21:05:00 - AI 教练开始私信用户
         - 未提交用户：提醒 + 鼓励
         - 已提交用户：表扬 + 改进建议
```

## 部署配置

### 环境变量

```bash
NODE_ENV=production
PORT=3000
DASHSCOPE_API_KEY=sk-xxxxx
DASHSCOPE_MODEL=qwen-plus
AI_PROVIDER=dashscope
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
```

### 定时任务配置 (feishu-config.yaml)

```yaml
triggers:
  - type: Timer
    config:
      cron: '0 21 * * *'  # 每天 21:00 锁定
      name: daily-lock
      payload:
        task: lock
  - type: Timer
    config:
      cron: '5 21 * * *'  # 每天 21:05 AI 教练
      name: ai-coach
      payload:
        task: ai_coach
```

## 用户使用流程

```
1. 打开 H5 应用 → 登录（飞书 OAuth）
2. 查看首页 → 了解本周得分
3. 点击填报 → 填写今日活动量
4. 提交 → 获得 AI 教练反馈
5. 查看报表 → 了解团队情况
6. 查看排行 → 了解自己排名
```

## 管理员功能

### 触发定时任务

```bash
# 手动触发每日锁定
POST /api/scheduler
{"task": "lock"}

# 手动触发 AI 教练
POST /api/scheduler
{"task": "ai_coach"}

# 手动触发每日分析
POST /api/scheduler
{"task": "daily_analytics"}
```

### 查看日志

```bash
larkapps function logs --name scheduler-api --follow
```

## 测试清单

- [ ] 首页显示本周总分
- [ ] 首页显示已填报次数
- [ ] 填报页显示 10 个维度
- [ ] 填报页有底部导航
- [ ] 实时计算总分
- [ ] 21:00 后无法提交
- [ ] 提交后显示 AI 教练
- [ ] 报表页显示团队数据
- [ ] 排行页显示金银铜徽章
- [ ] 所有页面有底部导航
