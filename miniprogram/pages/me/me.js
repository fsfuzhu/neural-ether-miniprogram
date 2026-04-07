const app = getApp();

Page({
  data: {
    userInfo: {
      name: '墨染千秋',
      subtitle: 'NEO-INK INTELLIGENCE ARCHITECT',
      avatar: ''
    },
    menuItems: [
      { icon: '✎', label: '我的智能体', desc: '管理已创建的智能体' },
      { icon: '◷', label: '对话记录', desc: '查看历史对话' },
      { icon: '◈', label: '收藏', desc: '收藏的回答与灵感' },
      { icon: '⚙', label: '设置', desc: '偏好与账户设置' }
    ]
  },

  onLoad() {
    var savedName = wx.getStorageSync('userName');
    var savedAvatar = wx.getStorageSync('userAvatar');
    if (savedName) {
      app.globalData.userName = savedName;
      this.setData({ 'userInfo.name': savedName });
    }
    if (savedAvatar) {
      app.globalData.userAvatar = savedAvatar;
      this.setData({ 'userInfo.avatar': savedAvatar });
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.setData({
      'userInfo.name': app.globalData.userName,
      'userInfo.avatar': app.globalData.userAvatar || ''
    });
  },

  onChooseAvatar: function(e) {
    var avatarUrl = e.detail.avatarUrl;
    if (avatarUrl) {
      app.globalData.userAvatar = avatarUrl;
      this.setData({ 'userInfo.avatar': avatarUrl });
      wx.setStorageSync('userAvatar', avatarUrl);
      wx.showToast({ title: '头像已更新', icon: 'success' });
    }
  },

  onNicknameChange: function(e) {
    var name = (e.detail.value || '').trim();
    if (name && name !== this.data.userInfo.name) {
      app.globalData.userName = name;
      this.setData({ 'userInfo.name': name });
      wx.setStorageSync('userName', name);
      wx.showToast({ title: '昵称已更新', icon: 'success' });
    }
  },

  onMenuTap: function(e) {
    var idx = e.currentTarget.dataset.index;
    if (idx === 1) {
      wx.switchTab({ url: '/pages/history/history' });
    } else {
      wx.showToast({ title: '即将推出', icon: 'none' });
    }
  }
});
