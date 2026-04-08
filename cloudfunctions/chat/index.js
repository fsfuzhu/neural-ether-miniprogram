const http = require('http');
const url = require('url');

const API_BASE = 'http://150.109.45.246:8317';
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

  const { model, messages, modalities, image_config } = params;

  if (!model || !messages || !messages.length) {
    return { success: false, error: '缺少 model 或 messages 参数' };
  }

  try {
    const result = await requestAPI({ model, messages, modalities, image_config });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message || '请求失败' };
  }
};

function requestAPI(opts) {
  return new Promise((resolve, reject) => {
    const body = { model: opts.model, messages: opts.messages, stream: false };
    if (opts.modalities) body.modalities = opts.modalities;
    if (opts.image_config) body.image_config = opts.image_config;

    const postData = JSON.stringify(body);
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
      timeout: 180000
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      let totalLen = 0;
      res.on('data', (chunk) => {
        chunks.push(chunk);
        totalLen += chunk.length;
      });
      res.on('end', () => {
        const raw = Buffer.concat(chunks, totalLen).toString('utf8');
        try {
          const json = JSON.parse(raw);
          if (json.error) {
            return reject(new Error(json.error.message || JSON.stringify(json.error)));
          }
          if (!json.choices || !json.choices[0]) {
            return reject(new Error('API 返回格式异常'));
          }
          const msg = json.choices[0].message || {};
          const result = {
            content: msg.content || '',
            model: json.model,
            usage: json.usage
          };
          // 提取生成的图片（OpenRouter 风格）
          if (Array.isArray(msg.images) && msg.images.length) {
            result.images = msg.images.map(function(img) {
              if (img && img.image_url && img.image_url.url) return img.image_url.url;
              if (typeof img === 'string') return img;
              return null;
            }).filter(Boolean);
          }
          resolve(result);
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
