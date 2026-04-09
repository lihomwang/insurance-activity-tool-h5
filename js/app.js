// Vue 应用主文件

// 活动维度配置
const DIMENSIONS = [
  { id: 'new_leads', name: '新增准客户', eng: 'New Leads', score: 1, icon: '📝', color: '#F97316', bg: '#FFEDD5' },
  { id: 'referral', name: '转介绍', eng: 'Referral', score: 3, icon: '🌟', color: '#EC4899', bg: '#FCE7F3' },
  { id: 'invitation', name: '邀约', eng: 'Invitation', score: 1, icon: '📅', color: '#3B82F6', bg: '#DBEAFE' },
  { id: 'sales_meeting', name: '销售面谈', eng: 'Sales Meeting', score: 10, icon: '💼', color: '#10B981', bg: '#D1FAE5' },
  { id: 'recruit_meeting', name: '增员面谈', eng: 'Recruit Meeting', score: 10, icon: '👥', color: '#8B5CF6', bg: '#F3E8FF' },
  { id: 'business_plan', name: '事业项目书', eng: 'Business Plan', score: 1, icon: '📄', color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'deal', name: '成交', eng: 'Deal Closed', score: 10, icon: '🎉', color: '#EF4444', bg: '#FEE2E2' },
  { id: 'eop_guest', name: '嘉宾参加 EOP', eng: 'EOP Guest', score: 5, icon: '🎪', color: '#6366F1', bg: '#E0E7FF' },
  { id: 'cc_assessment', name: 'CC 测评', eng: 'CC Assessment', score: 5, icon: '📊', color: '#14B8A6', bg: '#CCFBF1' },
  { id: 'training', name: '送训', eng: 'Training', score: 10, icon: '📚', color: '#06B6D4', bg: '#A5F3FC' }
]

// 生成本周日历
function generateCalendarDays() {
  const now = new Date()
  const currentDay = now.getDay() || 7
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const monday = new Date(now)
  monday.setDate(now.getDate() - (currentDay - 1))

  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    days.push({
      day: dayNames[date.getDay()],
      date: date.getDate(),
      isToday: date.toDateString() === now.toDateString()
    })
  }
  return days
}

// 格式化当前日期
function formatCurrentDate() {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const dayName = dayNames[now.getDay()]
  return `${month}月${day}日 周${dayName}`
}

// 检查是否已锁定（测试模式：永不锁定）
function isLockedTime() {
  return false
}

// 获取锁定提示
function getLockMessage() {
  return ''
}

// URL 参数解析
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

// Vue 应用
const { createApp } = Vue

createApp({
  data() {
    return {
      currentPage: 'index',
      userInfo: null,
      weekScore: 0,
      activityCount: 0,
      currentMonth: new Date().getMonth() + 1,
      calendarDays: generateCalendarDays(),
      currentDate: formatCurrentDate(),
      activities: [],
      teamStats: { totalMembers: 0, avgScore: 0, totalScore: 0, starName: '-' },
      dimensionStats: {},
      members: [],
      dimensions: DIMENSIONS,
      counts: {},
      totalScore: 0,
      showSuccessToast: false,
      isLocked: false,
      lockMessage: '',
      isLoading: false
    }
  },

  async mounted() {
    // 初始化计数
    DIMENSIONS.forEach(dim => {
      this.counts[dim.id] = 0
    })

    // 检查锁定状态
    this.checkLockStatus()

    // 检查 URL 参数是否有飞书授权码
    const authCode = getUrlParam('code')
    if (authCode) {
      // 飞书授权回调，处理登录
      await this.handleFeishuAuth(authCode)
      return
    }

    // 检查是否有登录缓存
    const savedUser = localStorage.getItem('feishu_user_info')
    if (savedUser) {
      this.userInfo = JSON.parse(savedUser)
      this.currentPage = 'dashboard'
      await this.loadDashboardData()
    }
  },

  methods: {
    // 处理飞书授权
    async handleFeishuAuth(code) {
      this.isLoading = true
      try {
        this.userInfo = await api.feishuAuth(code)
        this.currentPage = 'dashboard'
        // 清除 URL 参数
        window.history.replaceState({}, document.title, window.location.pathname)
        await this.loadDashboardData()
      } catch (e) {
        console.error('登录失败:', e)
        alert('登录失败，请重试')
        this.currentPage = 'index'
      } finally {
        this.isLoading = false
      }
    },

    // 处理登录 - 跳转到飞书授权
    async handleLogin() {
      // 构造飞书授权 URL
      const redirectUri = encodeURIComponent(window.location.href.split('?')[0])
      const appId = 'cli_a95a6b370af8dcc8' // H5 应用 ID
      const authUrl = `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${appId}&redirect_uri=${redirectUri}&state=login`

      // 跳转到飞书授权
      window.location.href = authUrl
    },

    // 检查锁定状态
    checkLockStatus() {
      this.isLocked = isLockedTime()
      this.lockMessage = getLockMessage()
    },

    // 加载首页数据
    async loadDashboardData() {
      try {
        const [weekStats, activities] = await Promise.all([
          api.getWeekStats(),
          api.getActivities()
        ])
        this.weekScore = weekStats.weekScore || 0
        this.activityCount = weekStats.activityCount || 0
        this.activities = this.formatActivities(activities)
      } catch (error) {
        console.error('加载数据失败:', error)
        this.weekScore = 0
        this.activityCount = 0
        this.activities = []
      }
    },

    // 格式化活动数据
    formatActivities(activities) {
      if (!activities || !activities.length) return []

      const dimensionMap = {
        new_leads: { icon: '📝', name: '新增准客户' },
        referral: { icon: '🌟', name: '转介绍' },
        invitation: { icon: '📅', name: '邀约' },
        sales_meeting: { icon: '💼', name: '销售面谈' },
        recruit_meeting: { icon: '👥', name: '增员面谈' },
        business_plan: { icon: '📄', name: '事业项目书' },
        deal: { icon: '🎉', name: '成交' },
        eop_guest: { icon: '🎪', name: '嘉宾参加 EOP' },
        cc_assessment: { icon: '📊', name: 'CC 测评' },
        training: { icon: '📚', name: '送训' }
      }

      return Object.entries(activities)
        .filter(([key, value]) => dimensionMap[key] && value > 0)
        .map(([key, value]) => ({
          id: key,
          icon: dimensionMap[key].icon,
          name: dimensionMap[key].name,
          count: value,
          score: value * this.getDimensionScore(key)
        }))
    },

    // 获取维度分数
    getDimensionScore(id) {
      const scores = {
        new_leads: 1, referral: 3, invitation: 1, sales_meeting: 10,
        recruit_meeting: 10, business_plan: 1, deal: 10, eop_guest: 5,
        cc_assessment: 5, training: 10
      }
      return scores[id] || 0
    },

    // 加载报表数据
    async loadReportData() {
      try {
        const [teamStats, dimensionStats] = await Promise.all([
          api.getTeamStats(),
          api.getDimensionStats()
        ])
        this.teamStats = teamStats || { totalMembers: 0, avgScore: 0, totalScore: 0, starName: '-' }
        this.dimensionStats = dimensionStats || {}
      } catch (error) {
        console.error('加载报表数据失败:', error)
        this.teamStats = { totalMembers: 0, avgScore: 0, totalScore: 0, starName: '-' }
        this.dimensionStats = {}
      }
    },

    // 加载排行数据
    async loadRankingData() {
      try {
        this.members = await api.getRanking()
      } catch (error) {
        console.error('加载排行数据失败:', error)
        this.members = []
      }
    },

    // 更新计数
    updateCount(id, delta) {
      const dimension = this.dimensions.find(d => d.id === id)
      if (!dimension) return

      const newCount = Math.max(0, (this.counts[id] || 0) + delta)
      this.counts[id] = newCount
      this.calculateTotalScore()
    },

    // 计算总分
    calculateTotalScore() {
      this.totalScore = Object.entries(this.counts).reduce((sum, [id, count]) => {
        return sum + (this.getDimensionScore(id) * count)
      }, 0)
    },

    // 获取维度统计
    getDimensionStat(id) {
      return this.dimensionStats[id] || { count: 0, score: 0 }
    },

    // 获取排名徽章颜色
    getRankBadgeStyle(rank) {
      if (rank === 1) return 'linear-gradient(135deg, #FACC15 0%, #FDE047 100%)'
      if (rank === 2) return 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)'
      if (rank === 3) return 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
      return '#F3F4F6'
    },

    // 获取排名分数颜色
    getRankScoreColor(rank) {
      if (rank === 1) return '#FACC15'
      if (rank === 2) return '#9CA3AF'
      if (rank === 3) return '#F97316'
      return '#6B7280'
    },

    // 提交活动
    async handleSubmit() {
      if (this.isLocked) {
        alert('当前不在填报时间内哦～\n\n填报时间：每天 9:00 - 24:00\n请您合理安排时间！')
        return
      }

      const hasData = Object.values(this.counts).some(c => c > 0)
      if (!hasData) {
        alert('请填写至少一项活动量')
        return
      }

      const submitData = {
        date: new Date().toISOString().split('T')[0],
        items: Object.entries(this.counts)
          .filter(([_, count]) => count > 0)
          .map(([id, count]) => ({ dimensionId: id, count }))
      }

      try {
        const result = await api.submitActivity(submitData)
        if (result.success) {
          this.showSuccessToast = true
          setTimeout(() => {
            this.showSuccessToast = false
            DIMENSIONS.forEach(dim => {
              this.counts[dim.id] = 0
            })
            this.totalScore = 0
            this.currentPage = 'dashboard'
            this.loadDashboardData()
          }, 1500)
        }
      } catch (error) {
        alert('提交失败：' + error.message)
      }
    },

    // 退出登录
    handleLogout() {
      if (confirm('确定要退出登录吗？')) {
        api.clearAuth()
        this.userInfo = null
        this.currentPage = 'index'
      }
    }
  },

  watch: {
    async currentPage(newPage) {
      if (newPage === 'report') {
        await this.loadReportData()
      } else if (newPage === 'ranking') {
        await this.loadRankingData()
      }
      this.checkLockStatus()
    }
  }
}).mount('#app')

// 定时检查锁定状态（每分钟）
setInterval(() => {
  if (window.vueApp) {
    window.vueApp.checkLockStatus()
  }
}, 60000)

// 将应用实例暴露给全局
window.vueApp = null
setTimeout(() => {
  window.vueApp = document.querySelector('#app').__vue_app__
}, 100)
