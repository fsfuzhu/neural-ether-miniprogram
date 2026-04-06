const app = getApp();

Page({
  data: {
    userInfo: {
      name: '墨染千秋',
      subtitle: 'NEO-INK INTELLIGENCE ARCHITECT',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAd8E2NiQsoIbI7gEGakOwvWlUYaT8Tr4kxdQQg5XMGePAKhdZt6rb7U-YFdVotVhZGFAS3g8wtcQj0iQHFl2G4lryjqxixg7fBvZ6jBpgWMAOPzhoHf5R2GDEzhUl-jotPILvFQb1325RPq6_Y2LcTTldWnsRYDE7NBvX1yP_F92w_JY9pT-9TPdoQ8UY9cfHphztij0V13rWBmyXFSggQzMiQvTyDH3-q2IY5q49FadAXksd4oa0-YX-xvlZt8ivgg3ItL1hif4Mk'
    },
    menuItems: [
      { icon: '✎', label: '我的智能体', desc: '管理已创建的智能体' },
      { icon: '◷', label: '对话记录', desc: '查看历史对话' },
      { icon: '◈', label: '收藏', desc: '收藏的回答与灵感' },
      { icon: '⚙', label: '设置', desc: '偏好与账户设置' }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    // 同步用户名
    this.setData({ 'userInfo.name': app.globalData.userName });
  },

  onEditName() {
    const self = this;
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      success(res) {
        if (res.confirm && res.content && res.content.trim()) {
          const name = res.content.trim();
          app.globalData.userName = name;
          self.setData({ 'userInfo.name': name });
          wx.showToast({ title: '已更新', icon: 'success' });
        }
      }
    });
  },

  onMenuTap(e) {
    const idx = e.currentTarget.dataset.index;
    if (idx === 1) {
      // 对话记录
      wx.switchTab({ url: '/pages/history/history' });
    } else {
      wx.showToast({ title: '即将推出', icon: 'none' });
    }
  }
});
