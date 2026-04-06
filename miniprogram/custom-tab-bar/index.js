Component({
  data: {
    selected: 0,
    list: [
      { pagePath: "/pages/chat/chat", text: "对话", iconType: "chat" },
      { pagePath: "/pages/agent/agent", text: "智能体", iconType: "agent" },
      { pagePath: "/pages/history/history", text: "历史", iconType: "history" },
      { pagePath: "/pages/me/me", text: "我的", iconType: "me" }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
    }
  }
});
