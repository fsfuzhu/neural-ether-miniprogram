// app.js
App({
  onLaunch: function() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'aitest-1gzevg3q0e108fb1',
        traceUser: true,
      });
    }

    // 检测是否首次使用
    var savedName = wx.getStorageSync('userName');
    var savedAvatar = wx.getStorageSync('userAvatar');
    if (savedName) {
      this.globalData.userName = savedName;
    }
    if (savedAvatar) {
      this.globalData.userAvatar = savedAvatar;
    }
    if (!savedName && !savedAvatar) {
      this.globalData.needSetup = true;
    }
  },

  globalData: {
    apiBaseUrl: 'http://150.109.45.246:8317',
    apiKey: 'sk-9da4ea98b368a1e9a4feb3d900bf1a57e70163e3606c27e5bb9124017eb6002e',
    needSetup: false,
    userName: '墨染千秋',
    userAvatar: '',
    selectedModel: {
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro',
      provider: 'Google · 最强推荐',
    },
    models: [
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'Google · 最强推荐', strengths: ['推理', '创作', '代码'], recommended: true },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google · 稳定版', strengths: ['稳定可靠'] },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google · 快速', strengths: ['极速响应'] },
      { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Lite', provider: 'Google · 最轻量', strengths: ['轻量快捷'] },
    ],
    // 对话导航控制
    chatAction: null,       // 'new_agent' | 'resume' | null
    currentAgent: null,     // { name, desc, systemPrompt }
    resumeConvId: null,     // 要恢复的对话 ID
  },

  // ---- 对话记录存储 ----
  saveConversation(conv) {
    const list = wx.getStorageSync('conversations') || [];
    const idx = list.findIndex(c => c.id === conv.id);
    if (idx >= 0) {
      list[idx] = conv;
    } else {
      list.unshift(conv);
    }
    // 最多保留 50 条
    if (list.length > 50) list.length = 50;
    wx.setStorageSync('conversations', list);
  },

  getConversations() {
    return wx.getStorageSync('conversations') || [];
  },

  deleteConversation(id) {
    const list = (wx.getStorageSync('conversations') || []).filter(c => c.id !== id);
    wx.setStorageSync('conversations', list);
  }
});
