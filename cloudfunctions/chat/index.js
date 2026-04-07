const https = require('http');
const url = require('url');

const API_BASE = 'http://15.204.11.218:8317';
const API_KEY = 'sk-9da4ea98b368a1e9a4feb3d900bf1a57e70163e3606c27e5bb9124017eb6002e';

exports.main = async (event, context) => {
  // 兼容 HTTP 网关调用（参数在 event.body）和 callFunction 调用（参数直接在 event）
  let params = event;
  if (event.body) {
    try {
      params = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
      return { success: false, error: '请求体解析失败' };
    }
  }

  const { model, messages } = params;

  if (!model || !messages || !messages.length) {
    return { success: false, error: '缺少 model 或 messages 参数' };
  }

  try {
    const result = await requestAPI(model, messages);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message || '请求失败' };
  }
};

function requestAPI(model, messages) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      messages,
      stream: false
    });

    const parsed = url.parse(API_BASE);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 120000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.choices && json.choices[0]) {
            resolve({
              content: json.choices[0].message.content,
              model: json.model,
              usage: json.usage
            });
          } else {
            reject(new Error('API 返回格式异常'));
          }
        } catch (e) {
          reject(new Error('解析响应失败: ' + e.message));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.write(postData);
    req.end();
  });
}
