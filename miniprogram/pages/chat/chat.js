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
    conversationId: ''
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
        this.setData({
          agentName: conv.agentName,
          messages: conv.messages,
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

  scrollToBottom() {
    setTimeout(function() { this.setData({ toView: 'msg-bottom' }); }.bind(this), 50);
  },

  onSend() {
    var content = this.data.inputValue.trim();
    if (!content || this.data.isLoading) return;

    if (!this.data.conversationId) {
      this.setData({ conversationId: Date.now().toString() });
    }

    var messages = this.data.messages.concat([
      { role: 'user', content: content },
      { role: 'ai', content: '', isStreaming: true }
    ]);

    this.setData({ messages: messages, inputValue: '', isLoading: true });
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
        apiMessages.push({ role: 'user', content: m.content });
      } else if (m.role === 'ai' && m.content) {
        apiMessages.push({ role: 'assistant', content: m.content });
      }
    }
    return apiMessages;
  },

  _callAPI() {
    var self = this;
    var apiBaseUrl = app.globalData.apiBaseUrl;
    var apiKey = app.globalData.apiKey;
    var model = this.data.selectedModel.id;
    var apiMessages = this._buildApiMessages();

    // ---- 尝试流式请求 ----
    var fullContent = '';
    var sseBuffer = '';
    var chunkReceived = false;
    var finished = false;

    var task = wx.request({
      url: apiBaseUrl + '/v1/chat/completions',
      method: 'POST',
      enableChunkedTransfer: true,
      dataType: 'text',
      responseType: 'text',
      timeout: 120000,
      header: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      data: {
        model: model,
        messages: apiMessages,
        stream: true
      },
      success: function(res) {
        if (finished) return;

        if (chunkReceived) {
          // 流式已处理，直接结束
          finished = true;
          self._finishStream(fullContent);
          return;
        }

        // onChunkReceived 没触发，从完整响应中解析
        finished = true;
        var text = typeof res.data === 'string' ? res.data : '';
        var parsed = self._parseSSEText(text);
        if (parsed) {
          self._typewriterReveal(parsed);
        } else {
          // 尝试解析为普通 JSON
          try {
            var json = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            if (json && json.choices && json.choices[0]) {
              self._typewriterReveal(json.choices[0].message.content || '(无响应)');
            } else {
              self._finishStream('(无响应)');
            }
          } catch(e) {
            self._finishStream('(无响应)');
          }
        }
      },
      fail: function(err) {
        if (finished) return;
        finished = true;
        self._finishStream('', '请求失败: ' + (err.errMsg || '网络错误'));
      }
    });

    // 流式 chunk 处理
    task.onChunkReceived(function(res) {
      chunkReceived = true;
      try {
        var bytes = new Uint8Array(res.data);
        var text = '';
        if (typeof TextDecoder !== 'undefined') {
          text = new TextDecoder('utf-8').decode(bytes);
        } else {
          for (var k = 0; k < bytes.length; k++) {
            text += String.fromCharCode(bytes[k]);
          }
          try { text = decodeURIComponent(escape(text)); } catch(e) {}
        }

        sseBuffer += text;
        var lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || '';

        var updated = false;
        for (var j = 0; j < lines.length; j++) {
          var line = lines[j].trim();
          if (!line) continue;

          if (line === 'data: [DONE]') {
            if (!finished) {
              finished = true;
              self._finishStream(fullContent);
            }
            return;
          }

          if (line.indexOf('data: ') === 0) {
            try {
              var json = JSON.parse(line.substring(6));
              var delta = json.choices && json.choices[0] && json.choices[0].delta;
              if (delta && delta.content) {
                fullContent += delta.content;
                updated = true;
              }
            } catch(e) {}
          }
        }

        if (updated) {
          var messages = self.data.messages.slice();
          var last = messages.length - 1;
          messages[last] = { role: 'ai', content: fullContent, isStreaming: true };
          self.setData({ messages: messages });
          self.scrollToBottom();
        }
      } catch(e) {
        console.error('chunk error:', e);
      }
    });
  },

  // 从完整 SSE 文本中提取内容
  _parseSSEText: function(text) {
    if (!text || text.indexOf('data: ') < 0) return null;
    var content = '';
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.indexOf('data: ') !== 0) continue;
      var payload = line.substring(6);
      if (payload === '[DONE]') continue;
      try {
        var json = JSON.parse(payload);
        var delta = json.choices && json.choices[0] && json.choices[0].delta;
        if (delta && delta.content) {
          content += delta.content;
        }
        // 也检查 message 格式（非流式）
        var msg = json.choices && json.choices[0] && json.choices[0].message;
        if (msg && msg.content) {
          content += msg.content;
        }
      } catch(e) {}
    }
    return content || null;
  },

  // 打字机效果逐字显示
  _typewriterReveal: function(fullText) {
    var self = this;
    var index = 0;
    var speed = 20; // 每字 20ms

    function tick() {
      index += 2; // 每次显示2个字符，加快速度
      if (index >= fullText.length) {
        self._finishStream(fullText);
        return;
      }
      var messages = self.data.messages.slice();
      var last = messages.length - 1;
      messages[last] = { role: 'ai', content: fullText.substring(0, index), isStreaming: true };
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

    messages[last] = {
      role: 'ai',
      content: error || content || '(无响应)',
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
