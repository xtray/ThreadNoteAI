export type AppLanguage = 'en' | 'zh';

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'en';

export const sanitizeAppLanguage = (value: unknown): AppLanguage =>
    value === 'zh' ? 'zh' : DEFAULT_APP_LANGUAGE;

export type AppText = {
    settingsTitle: string;
    settingsSectionsLabel: string;
    aiSettingsCategoriesLabel: string;
    general: string;
    ai: string;
    notebook: string;
    models: string;
    providers: string;
    advanced: string;
    data: string;
    globalPreferencesTitle: string;
    globalPreferencesHint: string;
    appearance: string;
    language: string;
    themeEffect: string;
    themeEffectHint: string;
    english: string;
    chinese: string;
    light: string;
    dark: string;
    modelDefaultsTitle: string;
    modelDefaultsHint: string;
    modelConfiguration: string;
    mainWindowConcurrentModels: string;
    concurrentModelsHint: string;
    defaultMainModels: string;
    defaultMainModelsHint: string;
    slotLabel: (index: number) => string;
    builtIn: string;
    custom: string;
    subThreadModel: string;
    subThreadModelHint: string;
    providerSearch: string;
    providerSearchPlaceholder: string;
    providerMatchCount: (count: number) => string;
    clearSearch: string;
    builtInProviderApiKeys: string;
    enterProviderApiKey: (providerName: string) => string;
    customProviders: string;
    addProvider: string;
    noCustomProvidersMatch: string;
    customProvidersHint: string;
    customProviderFallbackName: string;
    modelSummary: (count: number, hasBaseUrl: boolean) => string;
    removeProvider: string;
    providerName: string;
    providerNamePlaceholder: string;
    baseUrl: string;
    baseUrlPlaceholder: string;
    apiKey: string;
    enterApiKey: string;
    modelsLabel: string;
    dragToReorder: string;
    enterModelNameFirst: string;
    modelNamePlaceholder: string;
    removeModel: string;
    addModel: string;
    lowFrequencyControlsTitle: string;
    lowFrequencyControlsHint: string;
    advancedHint: string;
    subSessionContextMode: string;
    newMode: string;
    keepMode: string;
    newModeHint: string;
    keepModeHint: string;
    modelProviderConfigTitle: string;
    modelProviderConfigHint: string;
    exportModelProviderConfig: string;
    importModelProviderConfig: string;
    aiChatsTitle: string;
    aiChatsHint: string;
    exportAllAiChats: string;
    overwriteCurrentChats: string;
    mergeIntoCurrentChats: string;
    notebookExport: string;
    notebookImport: string;
    exportAllNotesToDirectory: string;
    importNotesFromFile: string;
    openGlobalSettings: string;
    appName: string;
    newChat: string;
    searchChats: string;
    searchNotes: string;
    noChatsMatchSearch: string;
    clearAllChats: string;
    openSettings: string;
    noNotesYet: string;
    addToNoteHint: string;
    noNotesMatchSearch: string;
    clearAllNotes: string;
    resizeSidebar: string;
    deleteChat: string;
    deleteChatConfirmTitle: string;
    deleteChatConfirmBody: string;
    delete: string;
    deleteNote: string;
    exportMarkdown: string;
    clearAllChatsConfirmTitle: string;
    clearAllChatsConfirmBody: string;
    cancel: string;
    clearing: string;
    clearAll: string;
    deleteNoteConfirmTitle: string;
    deleteNoteConfirmBody: string;
    clearAllNotesConfirmTitle: string;
    clearAllNotesConfirmBody: string;
    noNotesToExport: string;
    directoryPickerUnavailable: string;
    exportedNotes: (count: number) => string;
    exportCanceledOrFailed: string;
    importedNoteTitle: (index: number) => string;
    noValidNotesFound: string;
    importedNotes: (count: number) => string;
    importFailed: string;
    noNoteSelected: string;
    notebookEmptyHint: string;
    writeMarkdownPlaceholder: string;
    help: string;
    basicGuide: string;
    closeHelp: string;
    basicOperations: string;
    welcomeTitle: string;
    welcomeHint: string;
    startNewChat: string;
    basicOperationItems: string[];
    primary: string;
    setAsPrimary: string;
    multiReply: string;
    on: string;
    off: string;
    multiReplyEnabledTitle: string;
    primaryOnlyRepliesTitle: string;
    copied: string;
    copy: string;
    regenerate: string;
    copyTurnMarkdownTitle: string;
    regenerateReplyTitle: string;
    copyCodeBlockTitle: string;
    selectionActionsLabel: string;
    copySelectedText: string;
    createSubSessionDialog: string;
    openSubSession: string;
    reasoning: string;
    deleteSubSession: string;
    deleteSubSessionConfirmTitle: string;
    deleteSubSessionConfirmBody: string;
    addToNote: string;
    deleteTurn: string;
    deleteTurnConfirmTitle: string;
    deleteTurnConfirmBody: string;
    mainChatPlaceholder: string;
    subThreadPlaceholder: string;
    send: string;
    stop: string;
    thinking: string;
    enterFullscreen: string;
    exitFullscreen: string;
    close: string;
    keepContextTooltip: string;
    newContextTooltip: string;
    staleTurnWarning: string;
};

const en: AppText = {
    settingsTitle: 'Settings',
    settingsSectionsLabel: 'Settings sections',
    aiSettingsCategoriesLabel: 'AI settings categories',
    general: 'General',
    ai: 'AI',
    notebook: 'Notebook',
    models: 'Models',
    providers: 'Providers',
    advanced: 'Advanced',
    data: 'Data',
    globalPreferencesTitle: 'Global Preferences',
    globalPreferencesHint: 'Set app-wide options here. Language changes apply immediately, and theme selection is stored for future visual themes.',
    appearance: 'Appearance',
    language: 'Language',
    themeEffect: 'Theme Effect',
    themeEffectHint: 'Dummy setting for now. It saves your choice but does not change the page theme yet.',
    english: 'English',
    chinese: 'Chinese',
    light: 'Light',
    dark: 'Dark',
    modelDefaultsTitle: 'Model Defaults',
    modelDefaultsHint: 'Choose the default model mix for the main chat and sub-threads.',
    modelConfiguration: 'Model Configuration',
    mainWindowConcurrentModels: 'Main Window Concurrent Models',
    concurrentModelsHint: 'Recommended: keep this at `2` or `3` only when you want side-by-side comparisons.',
    defaultMainModels: 'Default Main Models',
    defaultMainModelsHint: 'Slot 1 acts as the primary default. Add a second or third slot only for deliberate multi-model use.',
    slotLabel: (index) => `Slot ${index + 1}`,
    builtIn: 'Built-in',
    custom: 'Custom',
    subThreadModel: 'Sub-thread Model',
    subThreadModelHint: 'Use a lighter model here if sub-threads are mostly exploratory.',
    providerSearch: 'Provider Search',
    providerSearchPlaceholder: 'Search provider or model',
    providerMatchCount: (count) => `${count} match${count === 1 ? '' : 'es'}`,
    clearSearch: 'Clear search',
    builtInProviderApiKeys: 'Built-in Provider API Keys',
    enterProviderApiKey: (providerName) => `Enter ${providerName} API Key`,
    customProviders: 'Custom Providers',
    addProvider: 'Add Provider',
    noCustomProvidersMatch: 'No custom providers match the current search.',
    customProvidersHint: 'Add custom OpenAI-compatible providers (for example, NVIDIA) with Base URL, API key and model names.',
    customProviderFallbackName: 'Custom Provider',
    modelSummary: (count, hasBaseUrl) => `${count} model${count === 1 ? '' : 's'}${hasBaseUrl ? ' · Base URL set' : ''}`,
    removeProvider: 'Remove provider',
    providerName: 'Provider Name',
    providerNamePlaceholder: 'e.g. NVIDIA',
    baseUrl: 'Base URL',
    baseUrlPlaceholder: 'e.g. https://integrate.api.nvidia.com/v1',
    apiKey: 'API Key',
    enterApiKey: 'Enter API key',
    modelsLabel: 'Models',
    dragToReorder: 'Drag to reorder',
    enterModelNameFirst: 'Enter model name first',
    modelNamePlaceholder: 'e.g. meta/llama-3.1-70b-instruct',
    removeModel: 'Remove model',
    addModel: 'Add Model',
    lowFrequencyControlsTitle: 'Lower-Frequency Controls',
    lowFrequencyControlsHint: 'Use this area for behavior tuning that affects branching and context carry-over.',
    advancedHint: 'Controls how new sub-threads inherit context from the current conversation.',
    subSessionContextMode: 'Sub-Session Context Mode',
    newMode: 'New',
    keepMode: 'Keep',
    newModeHint: 'starts the sub-thread with only the anchor context.',
    keepModeHint: 'reuses the current thread history before branching.',
    modelProviderConfigTitle: 'Models & Providers Configuration',
    modelProviderConfigHint: 'Back up and restore all Models and Providers settings, including model slots, provider API keys, and custom provider model lists, as one JSON file.',
    exportModelProviderConfig: 'Export Models & Providers Configuration',
    importModelProviderConfig: 'Import Models & Providers Configuration',
    aiChatsTitle: 'AI Chats',
    aiChatsHint: 'Export all chat history or import a saved chat archive with overwrite or merge behavior.',
    exportAllAiChats: 'Export All AI Chats',
    overwriteCurrentChats: 'Overwrite current chats',
    mergeIntoCurrentChats: 'Merge into current chats',
    notebookExport: 'Export',
    notebookImport: 'Import',
    exportAllNotesToDirectory: 'Export All Notes to Directory',
    importNotesFromFile: 'Import Notes from Export File',
    openGlobalSettings: 'Open global settings',
    appName: 'ThreadNote AI',
    newChat: 'New Chat',
    searchChats: 'Search chats',
    searchNotes: 'Search notes',
    noChatsMatchSearch: 'No chats match this search.',
    clearAllChats: 'Clear All Chats',
    openSettings: 'Settings',
    noNotesYet: 'No notes yet.',
    addToNoteHint: 'Right click AI response text and choose Add to note.',
    noNotesMatchSearch: 'No notes match this search.',
    clearAllNotes: 'Clear All Notes',
    resizeSidebar: 'Resize sidebar',
    deleteChat: 'Delete Chat',
    deleteChatConfirmTitle: 'Delete this chat?',
    deleteChatConfirmBody: 'This will remove the selected chat, its sub-threads, and annotations.',
    delete: 'Delete',
    deleteNote: 'Delete',
    exportMarkdown: 'Export Markdown',
    clearAllChatsConfirmTitle: 'Clear all chats?',
    clearAllChatsConfirmBody: 'This will permanently remove all chats, sub-sessions, and annotations from local storage.',
    cancel: 'Cancel',
    clearing: 'Clearing...',
    clearAll: 'Clear All',
    deleteNoteConfirmTitle: 'Delete this note?',
    deleteNoteConfirmBody: 'This action cannot be undone.',
    clearAllNotesConfirmTitle: 'Clear all notes?',
    clearAllNotesConfirmBody: 'This will permanently remove all notebook items from local storage.',
    noNotesToExport: 'No notes to export.',
    directoryPickerUnavailable: 'Directory picker not available. Exported as a JSON file instead.',
    exportedNotes: (count) => `Exported ${count} notes.`,
    exportCanceledOrFailed: 'Export canceled or failed.',
    importedNoteTitle: (index) => `Imported Note ${index + 1}`,
    noValidNotesFound: 'No valid notes found in this file.',
    importedNotes: (count) => `Imported ${count} notes.`,
    importFailed: 'Import failed. Please choose a valid export JSON file.',
    noNoteSelected: 'No note selected',
    notebookEmptyHint: 'Right click an AI response selection and choose "Add to note" to create your first note.',
    writeMarkdownPlaceholder: 'Write Markdown...',
    help: 'Help',
    basicGuide: 'Basic guide',
    closeHelp: 'Close help',
    basicOperations: 'Basic Operations',
    welcomeTitle: 'Welcome to ThreadNote AI',
    welcomeHint: 'Select a word in any AI response to create a nested sub-session.',
    startNewChat: 'Start New Chat',
    basicOperationItems: [
        'Click Start New Chat to create a new conversation.',
        'Press Enter to send, Shift+Enter or Ctrl+J to insert a new line.',
        'Select text in an AI reply to create a nested sub-session.',
        'Use right-click actions to save reply snippets into Notebook.',
        'Switch to Notebook mode from the left panel to edit notes.',
    ],
    primary: 'Primary',
    setAsPrimary: 'Set as primary',
    multiReply: 'Multi Reply',
    on: 'ON',
    off: 'OFF',
    multiReplyEnabledTitle: 'Multi-model replies enabled',
    primaryOnlyRepliesTitle: 'Primary-only replies enabled',
    copied: 'Copied',
    copy: 'Copy',
    regenerate: 'Regenerate',
    copyTurnMarkdownTitle: 'Copy question + answer as Markdown',
    regenerateReplyTitle: 'Regenerate this reply',
    copyCodeBlockTitle: 'Copy code block',
    selectionActionsLabel: 'Selection actions',
    copySelectedText: 'Copy selected text',
    createSubSessionDialog: 'Create sub-session dialog',
    openSubSession: 'Open sub-session',
    reasoning: 'Reasoning',
    deleteSubSession: 'Delete Sub-session',
    deleteSubSessionConfirmTitle: 'Delete sub-session?',
    deleteSubSessionConfirmBody: 'This will remove this sub-session and all nested sub-sessions.',
    addToNote: 'Add to note',
    deleteTurn: 'Delete turn',
    deleteTurnConfirmTitle: 'Delete turn?',
    deleteTurnConfirmBody: 'This will remove the selected question and its reply.',
    mainChatPlaceholder: 'Type a message...',
    subThreadPlaceholder: 'Ask about this...',
    send: 'Send',
    stop: 'Stop',
    thinking: 'Thinking...',
    enterFullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    close: 'Close',
    keepContextTooltip: 'Use main chat snapshot + sub-session history',
    newContextTooltip: 'Use only sub-session history',
    staleTurnWarning: 'Regenerated this reply; later turns may be stale.',
};

const zh: AppText = {
    settingsTitle: '设置',
    settingsSectionsLabel: '设置分区',
    aiSettingsCategoriesLabel: 'AI 设置分类',
    general: '通用',
    ai: 'AI',
    notebook: '笔记',
    models: '模型',
    providers: '提供商',
    advanced: '高级',
    data: '数据',
    globalPreferencesTitle: '全局偏好',
    globalPreferencesHint: '在这里设置全局选项。语言切换会立即生效，主题选项会先持久化，供后续真实主题使用。',
    appearance: '外观',
    language: '语言',
    themeEffect: '主题效果',
    themeEffectHint: '当前只是占位设置。它会保存你的选择，但暂时不会改变页面主题。',
    english: 'English',
    chinese: '中文',
    light: '浅色',
    dark: '深色',
    modelDefaultsTitle: '模型默认值',
    modelDefaultsHint: '选择主聊天和子线程的默认模型组合。',
    modelConfiguration: '模型配置',
    mainWindowConcurrentModels: '主窗口并发模型数',
    concurrentModelsHint: '建议只在需要并排对比时使用 `2` 或 `3`。',
    defaultMainModels: '默认主模型',
    defaultMainModelsHint: '槽位 1 是主默认模型。只有在明确需要多模型时再增加第二或第三个槽位。',
    slotLabel: (index) => `槽位 ${index + 1}`,
    builtIn: '内置',
    custom: '自定义',
    subThreadModel: '子线程模型',
    subThreadModelHint: '如果子线程主要用于探索，可以选择更轻量的模型。',
    providerSearch: '提供商搜索',
    providerSearchPlaceholder: '搜索提供商或模型',
    providerMatchCount: (count) => `匹配 ${count} 项`,
    clearSearch: '清除搜索',
    builtInProviderApiKeys: '内置提供商 API Key',
    enterProviderApiKey: (providerName) => `输入 ${providerName} API Key`,
    customProviders: '自定义提供商',
    addProvider: '添加提供商',
    noCustomProvidersMatch: '当前搜索下没有匹配的自定义提供商。',
    customProvidersHint: '添加兼容 OpenAI 的自定义提供商，并配置 Base URL、API Key 和模型名称。',
    customProviderFallbackName: '自定义提供商',
    modelSummary: (count, hasBaseUrl) => `${count} 个模型${hasBaseUrl ? ' · 已设置 Base URL' : ''}`,
    removeProvider: '移除提供商',
    providerName: '提供商名称',
    providerNamePlaceholder: '例如 NVIDIA',
    baseUrl: 'Base URL',
    baseUrlPlaceholder: '例如 https://integrate.api.nvidia.com/v1',
    apiKey: 'API Key',
    enterApiKey: '输入 API Key',
    modelsLabel: '模型',
    dragToReorder: '拖动以重新排序',
    enterModelNameFirst: '请先输入模型名称',
    modelNamePlaceholder: '例如 meta/llama-3.1-70b-instruct',
    removeModel: '移除模型',
    addModel: '添加模型',
    lowFrequencyControlsTitle: '低频设置',
    lowFrequencyControlsHint: '这里用于调整影响分支行为和上下文继承的设置。',
    advancedHint: '控制新的子线程如何继承当前对话的上下文。',
    subSessionContextMode: '子会话上下文模式',
    newMode: '新建',
    keepMode: '保留',
    newModeHint: '仅使用锚点上下文启动子线程。',
    keepModeHint: '在分支前复用当前线程历史。',
    modelProviderConfigTitle: '模型与提供商配置',
    modelProviderConfigHint: '将所有模型和提供商设置备份或恢复为一个 JSON 文件，包括模型槽位、提供商 API Key 和自定义提供商模型列表。',
    exportModelProviderConfig: '导出模型与提供商配置',
    importModelProviderConfig: '导入模型与提供商配置',
    aiChatsTitle: 'AI 聊天记录',
    aiChatsHint: '导出全部聊天记录，或导入已保存的聊天归档，并选择覆盖或合并。',
    exportAllAiChats: '导出全部 AI 聊天',
    overwriteCurrentChats: '覆盖当前聊天',
    mergeIntoCurrentChats: '合并到当前聊天',
    notebookExport: '导出',
    notebookImport: '导入',
    exportAllNotesToDirectory: '导出全部笔记到目录',
    importNotesFromFile: '从导出文件导入笔记',
    openGlobalSettings: '打开全局设置',
    appName: 'ThreadNote AI',
    newChat: '新建聊天',
    searchChats: '搜索聊天',
    searchNotes: '搜索笔记',
    noChatsMatchSearch: '没有聊天匹配当前搜索。',
    clearAllChats: '清空全部聊天',
    openSettings: '设置',
    noNotesYet: '还没有笔记。',
    addToNoteHint: '右键点击 AI 回复文本并选择“添加到笔记”。',
    noNotesMatchSearch: '没有笔记匹配当前搜索。',
    clearAllNotes: '清空全部笔记',
    resizeSidebar: '调整侧边栏宽度',
    deleteChat: '删除聊天',
    deleteChatConfirmTitle: '删除这个聊天？',
    deleteChatConfirmBody: '这会删除当前选中的聊天、其子线程和相关标注。',
    delete: '删除',
    deleteNote: '删除',
    exportMarkdown: '导出 Markdown',
    clearAllChatsConfirmTitle: '清空所有聊天？',
    clearAllChatsConfirmBody: '这会从本地存储中永久删除所有聊天、子会话和标注。',
    cancel: '取消',
    clearing: '清除中...',
    clearAll: '全部清空',
    deleteNoteConfirmTitle: '删除这条笔记？',
    deleteNoteConfirmBody: '此操作无法撤销。',
    clearAllNotesConfirmTitle: '清空所有笔记？',
    clearAllNotesConfirmBody: '这会从本地存储中永久删除所有笔记内容。',
    noNotesToExport: '没有可导出的笔记。',
    directoryPickerUnavailable: '当前环境不支持目录选择器，已改为导出 JSON 文件。',
    exportedNotes: (count) => `已导出 ${count} 条笔记。`,
    exportCanceledOrFailed: '导出已取消或失败。',
    importedNoteTitle: (index) => `导入的笔记 ${index + 1}`,
    noValidNotesFound: '文件中没有找到有效的笔记。',
    importedNotes: (count) => `已导入 ${count} 条笔记。`,
    importFailed: '导入失败。请选择有效的导出 JSON 文件。',
    noNoteSelected: '未选择笔记',
    notebookEmptyHint: '右键点击 AI 回复中的选中文本，并选择“添加到笔记”来创建第一条笔记。',
    writeMarkdownPlaceholder: '编写 Markdown...',
    help: '帮助',
    basicGuide: '基础指南',
    closeHelp: '关闭帮助',
    basicOperations: '基础操作',
    welcomeTitle: '欢迎使用 ThreadNote AI',
    welcomeHint: '在任意 AI 回复中选择一个词，即可创建嵌套子会话。',
    startNewChat: '开始新聊天',
    basicOperationItems: [
        '点击“开始新聊天”创建新的对话。',
        '按 Enter 发送，按 Shift+Enter 或 Ctrl+J 插入换行。',
        '选中 AI 回复中的文本以创建嵌套子会话。',
        '使用右键操作把回复片段保存到笔记。',
        '从左侧面板切换到笔记模式以编辑笔记。',
    ],
    primary: '主回复',
    setAsPrimary: '设为主回复',
    multiReply: '多回复',
    on: '开启',
    off: '关闭',
    multiReplyEnabledTitle: '已启用多模型回复',
    primaryOnlyRepliesTitle: '仅启用主回复',
    copied: '已复制',
    copy: '复制',
    regenerate: '重新生成',
    copyTurnMarkdownTitle: '复制问题和回答为 Markdown',
    regenerateReplyTitle: '重新生成这条回复',
    copyCodeBlockTitle: '复制代码块',
    selectionActionsLabel: '选择操作',
    copySelectedText: '复制所选文本',
    createSubSessionDialog: '创建子会话对话框',
    openSubSession: '打开子会话',
    reasoning: '思考过程',
    deleteSubSession: '删除子会话',
    deleteSubSessionConfirmTitle: '删除子会话？',
    deleteSubSessionConfirmBody: '这会删除当前子会话及其所有嵌套子会话。',
    addToNote: '添加到笔记',
    deleteTurn: '删除该轮',
    deleteTurnConfirmTitle: '删除这一轮？',
    deleteTurnConfirmBody: '这会删除当前选中的问题及其回复。',
    mainChatPlaceholder: '输入消息...',
    subThreadPlaceholder: '继续追问这段内容...',
    send: '发送',
    stop: '停止',
    thinking: '思考中...',
    enterFullscreen: '进入全屏',
    exitFullscreen: '退出全屏',
    close: '关闭',
    keepContextTooltip: '使用主聊天快照和子会话历史',
    newContextTooltip: '仅使用子会话历史',
    staleTurnWarning: '已重新生成这条回复；后续轮次可能已过时。',
};

const APP_TEXT: Record<AppLanguage, AppText> = { en, zh };

export const getAppText = (language: AppLanguage): AppText => APP_TEXT[language];
