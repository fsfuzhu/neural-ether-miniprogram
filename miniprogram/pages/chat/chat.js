const app = getApp();

Page({
  data: {
    selectedModel: {},
    models: [],
    showModelPicker: false,
    messages: [],
    inputValue: '',
    isLoading: false,
    toView: '',
    agentName: 'Neural AI',
    userName: '墨染千秋',
    conversationId: '',
    keyboardHeight: 0,
    pendingImage: '',
    pendingImageBase64: '',
    showSetup: false,
    setupAvatar: '',
    setupName: ''
  },

  onLoad() {
    this.setData({
      selectedModel: app.globalData.selectedModel,
      models: app.globalData.models,
      userName: app.globalData.userName
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.setData({ userName: app.globalData.userName });
    this._handleChatAction();

    // 首次使用引导
    if (app.globalData.needSetup) {
      this.setData({ showSetup: true });
    }
  },

  onSetupAvatar: function(e) {
    this.setData({ setupAvatar: e.detail.avatarUrl || '' });
  },

  onSetupNickname: function(e) {
    this.setData({ setupName: (e.detail.value || '').trim() });
  },

  onSetupNicknameInput: function(e) {
    this.setData({ setupName: (e.detail.value || '').trim() });
  },

  onSetupConfirm: function() {
    var name = this.data.setupName;
    var avatar = this.data.setupAvatar;
    if (!name && !avatar) return;

    if (name) {
      app.globalData.userName = name;
      wx.setStorageSync('userName', name);
    }
    if (avatar) {
      app.globalData.userAvatar = avatar;
      wx.setStorageSync('userAvatar', avatar);
    }
    app.globalData.needSetup = false;
    this.setData({ showSetup: false, userName: name || this.data.userName });
    wx.showToast({ title: '设置成功', icon: 'success' });
  },

  onSetupSkip: function() {
    app.globalData.needSetup = false;
    this.setData({ showSetup: false });
  },

  _handleChatAction() {
    var action = app.globalData.chatAction;
    if (!action) return;

    if (action === 'new_agent' && app.globalData.currentAgent) {
      var agent = app.globalData.currentAgent;
      this.setData({
        agentName: agent.name,
        messages: [],
        conversationId: Date.now().toString(),
        isLoading: false
      });
      this._systemPrompt = agent.systemPrompt || '';
    } else if (action === 'resume' && app.globalData.resumeConvId) {
      var convs = app.getConversations();
      var conv = convs.find(function(c) { return c.id === app.globalData.resumeConvId; });
      if (conv) {
        // 恢复时重新解析 markdown
        var self = this;
        var msgs = conv.messages.map(function(m) {
          if (m.role === 'ai' && m.content) {
            m.html = self._parseMd(m.content);
          }
          return m;
        });
        this.setData({
          agentName: conv.agentName,
          messages: msgs,
          conversationId: conv.id,
          isLoading: false
        });
        this._systemPrompt = conv.systemPrompt || '';
        this.scrollToBottom();
      }
    }

    app.globalData.chatAction = null;
    app.globalData.currentAgent = null;
    app.globalData.resumeConvId = null;
  },

  toggleModelPicker() {
    this.setData({ showModelPicker: !this.data.showModelPicker });
  },

  selectModel(e) {
    var model = this.data.models[e.currentTarget.dataset.index];
    this.setData({ selectedModel: model, showModelPicker: false });
    app.globalData.selectedModel = model;
  },

  closeModelPicker() {
    this.setData({ showModelPicker: false });
  },

  onInputChange(e) {
    this.setData({ inputValue: e.detail.value });
  },

  onKeyboardHeight(e) {
    var h = e.detail.height || 0;
    this.setData({ keyboardHeight: h });
    if (h > 0) {
      this.scrollToBottom();
    }
  },

  scrollToBottom() {
    setTimeout(function() { this.setData({ toView: 'msg-bottom' }); }.bind(this), 50);
  },

  // ---- 图片/文件选择 ----
  onChooseImage: function() {
    var self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function(res) {
        var file = res.tempFiles[0];
        self.setData({ pendingImage: file.tempFilePath });
        // 转 base64
        wx.getFileSystemManager().readFile({
          filePath: file.tempFilePath,
          encoding: 'base64',
          success: function(data) {
            var ext = file.tempFilePath.split('.').pop().toLowerCase();
            var mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
            self.setData({ pendingImageBase64: 'data:' + mime + ';base64,' + data.data });
          }
        });
      }
    });
  },

  onChooseFile: function() {
    var self = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: function(res) {
        var file = res.tempFiles[0];
        var name = file.name || '';
        var ext = name.split('.').pop().toLowerCase();
        // 图片文件走图片流程
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].indexOf(ext) >= 0) {
          self.setData({ pendingImage: file.path });
          wx.getFileSystemManager().readFile({
            filePath: file.path,
            encoding: 'base64',
            success: function(data) {
              var mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
              self.setData({ pendingImageBase64: 'data:' + mime + ';base64,' + data.data });
            }
          });
        } else {
          // 文本文件直接读内容
          wx.showLoading({ title: '读取文件...' });
          wx.getFileSystemManager().readFile({
            filePath: file.path,
            encoding: 'utf-8',
            success: function(data) {
              wx.hideLoading();
              var text = data.data;
              if (text.length > 10000) text = text.substring(0, 10000) + '\n...(文件过长，已截断)';
              var current = self.data.inputValue;
              self.setData({ inputValue: current + '\n【文件: ' + name + '】\n' + text });
            },
            fail: function() {
              wx.hideLoading();
              wx.showToast({ title: '不支持该文件格式', icon: 'none' });
            }
          });
        }
      }
    });
  },

  onRemovePending: function() {
    this.setData({ pendingImage: '', pendingImageBase64: '' });
  },

  onPreviewImage: function(e) {
    wx.previewImage({ urls: [e.currentTarget.dataset.url] });
  },

  onSend() {
    var content = this.data.inputValue.trim();
    var hasImage = !!this.data.pendingImageBase64;
    if ((!content && !hasImage) || this.data.isLoading) return;

    if (!this.data.conversationId) {
      this.setData({ conversationId: Date.now().toString() });
    }

    // 构建用户消息（带图片预览）
    var userMsg = { role: 'user', content: content || '(图片)' };
    if (hasImage) {
      userMsg.image = this.data.pendingImage;
      userMsg.imageBase64 = this.data.pendingImageBase64;
    }

    var messages = this.data.messages.concat([
      userMsg,
      { role: 'ai', content: '', isStreaming: true }
    ]);

    this.setData({
      messages: messages,
      inputValue: '',
      pendingImage: '',
      pendingImageBase64: '',
      isLoading: true
    });
    this.scrollToBottom();
    this._callAPI();
  },

  _buildApiMessages() {
    var systemContent = this._systemPrompt
      ? this._systemPrompt
      : '你是 ' + this.data.agentName + '，一个融合东方美学与现代科技的智能助手。请用中文回答，简洁优雅。';

    var apiMessages = [{ role: 'system', content: systemContent }];
    var msgs = this.data.messages;
    for (var i = 0; i < msgs.length - 1; i++) {
      var m = msgs[i];
      if (m.role === 'user') {
        // 多模态消息（文字+图片）
        if (m.imageBase64) {
          var parts = [];
          if (m.content && m.content !== '(图片)') {
            parts.push({ type: 'text', text: m.content });
          } else {
            parts.push({ type: 'text', text: '请分析这张图片' });
          }
          parts.push({ type: 'image_url', image_url: { url: m.imageBase64 } });
          apiMessages.push({ role: 'user', content: parts });
        } else {
          apiMessages.push({ role: 'user', content: m.content });
        }
      } else if (m.role === 'ai' && m.content) {
        apiMessages.push({ role: 'assistant', content: m.content });
      }
    }
    return apiMessages;
  },

  _callAPI() {
    var self = this;
    var model = this.data.selectedModel.id;
    var apiMessages = this._buildApiMessages();

    wx.request({
      url: 'https://aitest-1gzevg3q0e108fb1.service.tcloudbase.com/chat',
      method: 'POST',
      timeout: 120000,
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        model: model,
        messages: apiMessages
      },
      success: function(res) {
        var d = res.data;
        if (d && d.success && d.data && d.data.content) {
          self._typewriterReveal(d.data.content);
        } else {
          self._finishStream('', d && d.error ? d.error : '(无响应)');
        }
      },
      fail: function(err) {
        self._finishStream('', '请求失败: ' + (err.errMsg || '网络错误'));
      }
    });
  },

  // ---- Markdown 解析 ----
  _parseMd: function(text) {
    if (!text) return '';
    var lines = text.split('\n');
    var result = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.replace(/^\s+/, '');

      if (trimmed.indexOf('### ') === 0) {
        result.push('<div style="font-weight:700;font-size:15px;margin:10px 0 4px;color:#162839;">' + this._inlineMd(trimmed.substring(4)) + '</div>');
      } else if (trimmed.indexOf('## ') === 0) {
        result.push('<div style="font-weight:700;font-size:16px;margin:12px 0 4px;color:#162839;">' + this._inlineMd(trimmed.substring(3)) + '</div>');
      } else if (trimmed.indexOf('# ') === 0) {
        result.push('<div style="font-weight:700;font-size:17px;margin:14px 0 6px;color:#162839;">' + this._inlineMd(trimmed.substring(2)) + '</div>');
      } else if (/^[-*]\s/.test(trimmed)) {
        result.push('<div style="padding-left:14px;margin:3px 0;"><span style="margin-right:6px;">•</span>' + this._inlineMd(trimmed.substring(2)) + '</div>');
      } else if (/^\d+\.\s/.test(trimmed)) {
        var dotIdx = trimmed.indexOf('. ');
        result.push('<div style="padding-left:14px;margin:3px 0;">' + trimmed.substring(0, dotIdx + 2) + this._inlineMd(trimmed.substring(dotIdx + 2)) + '</div>');
      } else if (trimmed === '') {
        result.push('<div style="height:8px;"></div>');
      } else {
        result.push('<div style="margin:2px 0;">' + this._inlineMd(line) + '</div>');
      }
    }
    return result.join('');
  },

  _inlineMd: function(text) {
    // HTML escape
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Bold: **text**
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text* (not inside **)
    text = text.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
    // Inline code: `text`
    text = text.replace(/`([^`]+?)`/g, '<span style="background:#eae8e3;padding:1px 5px;border-radius:3px;font-size:13px;font-family:monospace;">$1</span>');
    return text;
  },

  // 打字机效果逐字显示
  _typewriterReveal: function(fullText) {
    var self = this;
    var index = 0;
    var speed = 20;

    function tick() {
      index += 2;
      if (index >= fullText.length) {
        self._finishStream(fullText);
        return;
      }
      var partial = fullText.substring(0, index);
      var messages = self.data.messages.slice();
      var last = messages.length - 1;
      messages[last] = { role: 'ai', content: partial, html: self._parseMd(partial), isStreaming: true };
      self.setData({ messages: messages });
      self.scrollToBottom();
      self._typeTimer = setTimeout(tick, speed);
    }
    tick();
  },

  _finishStream: function(content, error) {
    if (this._typeTimer) {
      clearTimeout(this._typeTimer);
      this._typeTimer = null;
    }
    var messages = this.data.messages.slice();
    var last = messages.length - 1;
    if (last < 0) return;

    var finalText = error || content || '(无响应)';
    messages[last] = {
      role: 'ai',
      content: finalText,
      html: this._parseMd(finalText),
      isStreaming: false
    };
    this.setData({ messages: messages, isLoading: false });
    this.scrollToBottom();
    if (!error && content) {
      this._saveCurrentConversation();
    }
  },

  _saveCurrentConversation: function() {
    if (!this.data.messages.length) return;
    var lastMsg = this.data.messages[this.data.messages.length - 1];
    app.saveConversation({
      id: this.data.conversationId,
      agentName: this.data.agentName,
      modelId: this.data.selectedModel.id,
      modelName: this.data.selectedModel.name,
      systemPrompt: this._systemPrompt || '',
      messages: this.data.messages,
      lastMessage: lastMsg.content.slice(0, 50),
      updatedAt: Date.now()
    });
  }
});
