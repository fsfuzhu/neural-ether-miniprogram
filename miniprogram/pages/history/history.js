const app = getApp();

Page({
  data: {
    conversations: []
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.setData({ conversations: app.getConversations() });
  },

  onResume(e) {
    const id = e.currentTarget.dataset.id;
    app.globalData.chatAction = 'resume';
    app.globalData.resumeConvId = id;
    wx.switchTab({ url: '/pages/chat/chat' });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除对话',
      content: '确定删除这条对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          app.deleteConversation(id);
          this.setData({ conversations: app.getConversations() });
        }
      }
    });
  },

  formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }
});
