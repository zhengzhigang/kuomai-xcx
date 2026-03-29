// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch(options) {
    // 捕获 App 打开时携带的 token 参数
    if (options && options.query && options.query.token) {
      const token = options.query.token;
      wx.setStorageSync('_userToken', token);
      console.log('App Launch 捕获到 token:', token);
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
  onShow(options) {
    // 如果是从后台切回前台，或者从其他 App 重新打开，也尝试捕获 token
    if (options && options.query && options.query.token) {
      const token = options.query.token;
      wx.setStorageSync('_userToken', token);
      console.log('App Show 捕获到 token:', token);
    }
  }
})