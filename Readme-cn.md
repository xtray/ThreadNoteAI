# ThreadNote AI 使用说明

## 1. 项目功能
ThreadNote AI 是一个支持多家 AI 提供商的 Web 聊天客户端。  
支持功能：
- 主会话聊天
- 从 AI 回复选中文本创建嵌套子会话
- 笔记本模式（Markdown 笔记）
- 本地历史持久化

## 2. 环境要求
- 推荐 Node.js 18+
- npm
- 现代浏览器（推荐 Chrome/Edge）

## 3. 启动项目
1. 在项目根目录打开终端。
2. 安装依赖：
   - `npm install`
3. 启动开发服务：
   - `npm run dev`
4. 打开终端输出的本地访问地址。

## 4. 生产构建
1. `npm run build`
2. 构建产物位于 `dist/`
3. 使用任意静态服务器部署 `dist/`

## 5. 基础使用
### AI 页面
- 点击 `New Chat` 创建新对话。
- 输入问题后按 Enter 或发送按钮。
- 生成过程中可点击 `Stop` 中止回复。
- 在主会话中可右键用户问题删除该轮对话。

### 子会话
- 在 AI 回复中选中文本，可创建/打开子会话。
- 子会话上下文与主会话隔离。
- 在子会话 AI 回复内右键可 `Add to note`。

### 笔记本页面
- 左侧显示笔记列表。
- 点击笔记可查看/编辑。
- 编辑体验接近 Typora：
  - 聚焦编辑时显示 Markdown 原文
  - 失焦后显示渲染结果

## 6. 笔记操作
在 Notebook 页面：
- 右键某条笔记可执行：
  - `Delete`（带确认）
  - `Export Markdown`（导出当前笔记）

- 底部操作：
  - `Clear All Notes`
  - `Settings`

Notebook Settings：
- `Export All Notes to Directory`
  - 浏览器支持目录选择时：导出多个 `.md` 文件 + 清单 JSON。
  - 不支持目录选择时：回退为下载单个 JSON 导出文件。
- `Import Notes from Export File`
  - 选择导出的 JSON 文件导入笔记。

## 7. AI 模型配置
在 AI 页面打开 `Settings`：
- 按提供商配置 API Key
- 配置主会话模型
- 配置子会话模型

支持提供商包括：
- MiniMax
- Zhipu GLM
- DeepSeek
- OpenAI

## 8. 数据存储
- 聊天/消息/笔记存储在浏览器 IndexedDB
- API Key 与模型配置存储在 localStorage
- 数据仅保存在当前浏览器配置文件与设备中

## 9. 常见问题
问：更换浏览器或设备后数据不见了？  
答：当前为本地存储，不会自动云同步。

问：模型请求失败？  
答：请检查 Settings 中 API Key 是否正确，以及模型是否可用。

问：导出全部笔记时没有弹目录选择？  
答：你的浏览器可能不支持目录选择接口，系统会自动回退为 JSON 文件导出。

## 10. 安全说明
- 请妥善保管 API Key。
- 当前实现下，导入笔记可能覆盖现有笔记集合。
- 大规模导入前建议先导出备份。
