// API 模块 - 后端接口调用

// API 基础地址 - Railway 后端
const API_BASE = 'https://insurance-activity-tool-backend-production.up.railway.app'
const USE_MOCK = false

// 飞书应用配置
const H5_APP_ID = 'cli_a95a6b370af8dcc8'

// 模拟数据（仅用于开发测试，当 USE_MOCK=true 时使用）
const mockData = {
  userInfo: null,
  weekScore: 0,
  activityCount: 0,
  activities: [],
  teamStats: { totalMembers: 0, avgScore: 0, totalScore: 0, starName: '-' },
  dimensionStats: {},
  members: []
}

// 本地存储键
const STORAGE_KEYS = {
  USER_INFO: 'feishu_user_info',
  ACCESS_TOKEN: 'feishu_access_token'
}

// URL 参数解析
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

// API 调用对象
const api = {
  // 飞书授权登录
  async feishuAuth(code) {
    if (USE_MOCK) {
      const user = { id: 'test_user', name: '测试用户', feishu_user_id: 'on_test123', avatar: '😊' }
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user))
      return user
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/feishu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, appId: H5_APP_ID })
      })

      if (!response.ok) throw new Error('登录失败')
      const data = await response.json()

      // 保存用户信息
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(data.user))
      if (data.token) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.token)
      }

      return data.user
    } catch (e) {
      console.error('飞书登录失败:', e)
      // 降级处理：尝试从 URL 参数获取用户信息
      const userId = getUrlParam('user_id')
      const name = getUrlParam('name')
      if (userId && name) {
        const user = { id: userId, name: name, feishu_user_id: userId, avatar: '😊' }
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user))
        return user
      }
      throw e
    }
  },

  // 获取用户信息（从本地或后端）
  async getUserInfo() {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_INFO)
    if (saved) {
      return JSON.parse(saved)
    }
    return null
  },

  // 获取本周统计
  async getWeekStats() {
    const user = await this.getUserInfo()
    if (!user) return { weekScore: 0, activityCount: 0 }

    if (USE_MOCK) return { weekScore: mockData.weekScore, activityCount: mockData.activityCount }

    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const response = await fetch(`${API_BASE}/api/user/week-stats`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      if (response.ok) {
        const result = await response.json()
        console.log('[API] week-stats result:', result)
        return {
          weekScore: result.weekScore || 0,
          activityCount: result.activityCount || 0
        }
      }
    } catch (e) {
      console.error('获取周统计失败:', e)
    }

    return { weekScore: 0, activityCount: 0 }
  },

  // 获取已填报活动
  async getActivities() {
    const user = await this.getUserInfo()
    if (!user) return []

    if (USE_MOCK) return mockData.activities

    try {
      const today = new Date().toISOString().split('T')[0]

      // 优先使用缓存（提交后临时缓存）
      const cached = localStorage.getItem('cached_activities_' + today)
      if (cached) {
        const data = JSON.parse(cached)
        if (Object.keys(data).length > 0) {
          return data
        }
      }

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const response = await fetch(`${API_BASE}/api/activities/today?date=${today}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      if (response.ok) {
        const result = await response.json()
        return result.data || result
      }
    } catch (e) {
      console.error('获取活动数据失败:', e)
    }

    return []
  },

  // 获取团队统计
  async getTeamStats() {
    if (USE_MOCK) return mockData.teamStats

    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const response = await fetch(`${API_BASE}/api/team/stats`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      if (response.ok) {
        const result = await response.json()
        console.log('[API] team-stats result:', result)
        return result.data || { totalMembers: 0, avgScore: 0, totalScore: 0, starName: '-' }
      }
    } catch (e) {
      console.error('获取团队统计失败:', e)
    }

    return { totalMembers: 0, avgScore: 0, totalScore: 0, starName: '-' }
  },

  // 获取维度统计
  async getDimensionStats() {
    if (USE_MOCK) return mockData.dimensionStats

    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const response = await fetch(`${API_BASE}/api/team/dimensions`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      if (response.ok) {
        const result = await response.json()
        console.log('[API] dimension-stats result:', result)
        return result.data || {}
      }
    } catch (e) {
      console.error('获取维度统计失败:', e)
    }

    return {}
  },

  // 获取排行榜
  async getRanking() {
    if (USE_MOCK) return mockData.members

    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const response = await fetch(`${API_BASE}/api/team/ranking`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      if (response.ok) {
        const result = await response.json()
        console.log('[API] ranking result:', result)
        return result.data || []
      }
    } catch (e) {
      console.error('获取排行榜失败:', e)
    }

    return []
  },

  // 提交活动量
  async submitActivity(data) {
    const user = await this.getUserInfo()
    if (!user) throw new Error('请先登录')

    if (USE_MOCK) {
      console.log('模拟提交:', data)
      return { success: true, message: '提交成功' }
    }

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('提交数据格式错误')
    }

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    const payload = {
      user_name: user.name,
      user_id: user.id,
      activity_date: data.date,
      is_submitted: 1
    }

    // 添加各维度数据
    data.items.forEach(item => {
      payload[item.dimensionId] = item.count
    })

    console.log('[API] 提交数据:', payload)

    const response = await fetch(`${API_BASE}/api/activities/submit`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[API] 提交失败:', error)
      throw new Error(error.message || '提交失败')
    }

    const result = await response.json()
    console.log('[API] 提交成功:', result)

    // 提交成功后刷新缓存数据
    const today = new Date().toISOString().split('T')[0]
    const activitiesData = {}
    data.items.forEach(item => {
      if (item.count > 0) {
        activitiesData[item.dimensionId] = item.count
      }
    })

    // 缓存今日活动数据，避免立即查询时数据库尚未写入
    localStorage.setItem('cached_activities_' + today, JSON.stringify(activitiesData))

    return result
  },

  // 获取今日累计分数和已有计数
  async getTodayScore() {
    const user = await this.getUserInfo()
    if (!user) return { todayScore: 0, hasSubmitted: false, counts: {} }

    if (USE_MOCK) return { todayScore: 0, hasSubmitted: false, counts: {} }

    try {
      const today = new Date().toISOString().split('T')[0]
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const response = await fetch(`${API_BASE}/api/activities/today-score?date=${today}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      if (response.ok) {
        return await response.json()
      }
    } catch (e) {
      console.error('获取今日分数失败:', e)
    }

    return { todayScore: 0, hasSubmitted: false, counts: {} }
  },

  // 检查锁定状态
  async checkLockStatus() {
    const hour = new Date().getHours()
    return { locked: hour >= 21 || hour < 9, hour }
  },

  // 清除登录状态
  clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.USER_INFO)
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  }
}
