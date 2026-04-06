# Neural Ether - 智能体对话小程序

基于微信小程序 + 腾讯云开发（CloudBase）的 AI 智能体对话平台，采用水墨美学设计风格。

[![Powered by CloudBase](https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/powered-by-cloudbase-badge.svg)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

## 功能特性

- **多智能体对话** — 9 个专业智能体，覆盖商业战略、视觉设计、文案策划、法律咨询等领域
- **AI 模型切换** — 支持 Gemini 3.1 Pro / 2.5 Pro / 2.5 Flash / 3.1 Lite 多模型自由切换
- **对话记录管理** — 自动保存对话历史，支持恢复和删除
- **个性化设置** — 自定义用户昵称，AI 名称跟随智能体动态变化
- **水墨美学 UI** — 墨青 + 朱砂红 + 翠玉色系，纸质纹理背景，东方美学设计

## 智能体列表

| 智能体 | 功能 |
|--------|------|
| 商业顶层设计顾问 | 企业战略定位、商业模式设计、执行路线图 |
| 商业门头设计大师 | 店铺门头视觉方案设计 |
| 专属音乐大师 | 品牌专属音乐定制 |
| 品牌文案策划师 | Slogan、社媒推文、广告文案 |
| 视频脚本策划师 | 短视频、广告片、直播脚本 |
| 商业法律顾问 | 中国及马来西亚商业法规咨询 |
| 日常宣传视频大师 | 品牌日常宣传短视频创作 |
| 日常海报设计大师 | 品牌日常运营海报设计 |
| 品宣海报设计大师 | 高品质品牌宣传海报设计 |

## 技术架构

```
┌─────────────────────────────────────────┐
│              微信小程序                    │
│  ┌─────────┐ ┌────────┐ ┌────────┐      │
│  │  对话页  │ │智能体页│ │ 历史页 │ ...  │
│  └────┬────┘ └────────┘ └────────┘      │
│       │                                  │
│       ▼                                  │
│  wx.request → API (OpenAI 兼容格式)       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Gemini API 中转站   │
│  (OpenAI 兼容接口)    │
└─────────────────────┘
```

## 项目结构

```
cloudbase/
├── miniprogram/
│   ├── app.js                    # 全局配置、API密钥、模型列表
│   ├── app.json                  # 页面路由、自定义TabBar
│   ├── app.wxss                  # 全局样式、设计令牌
│   ├── custom-tab-bar/           # 自定义底部导航栏
│   ├── pages/
│   │   ├── chat/                 # 对话页 — AI对话
│   │   ├── agent/                # 智能体页 — 智能体列表
│   │   ├── history/              # 历史页 — 对话记录管理
│   │   └── me/                   # 我的 — 个人信息设置
│   └── images/
├── cloudfunctions/               # 云函数（预留）
├── project.config.json           # 项目配置
└── README.md
```

## 设计系统

| 角色 | 色值 | 用途 |
|------|------|------|
| 墨青 Primary | `#162839` | 主文字、标题 |
| 朱砂 Secondary | `#b02d21` | 强调、按钮、活跃态 |
| 翠玉 Tertiary | `#112c1e` | AI气泡、辅助 |
| 暖纸 Background | `#fbf9f4` | 页面底色 |

## 快速开始

### 前置条件

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 腾讯云开发（CloudBase）环境
- 微信小程序 AppID

### 本地开发

1. 克隆仓库
   ```bash
   git clone https://github.com/anthropicsafeAI/neural-ether-miniprogram.git
   ```

2. 用微信开发者工具打开项目根目录

3. 在 `miniprogram/app.js` 中配置：
   - `apiBaseUrl` — API 服务地址
   - `apiKey` — API 密钥
   - CloudBase 环境 ID

4. 开发者工具设置中勾选「不校验合法域名」（开发阶段）

5. 编译运行

### 发布部署

正式发布前需要：
1. API 服务配置 HTTPS
2. 微信公众平台添加域名白名单
3. 或使用 CloudBase 云函数做 API 代理（推荐，无需域名配置）

## License

MIT
