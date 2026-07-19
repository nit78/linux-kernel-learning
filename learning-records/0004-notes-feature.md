# 笔记功能需求（LR-0004）

**Status:** active

用户在第 3 课交付后提出新需求:"我希望网页能做笔记,我遇到不会的搜索后把笔记加入。"

## Evidence
- 用户的工作流是:读课 → 遇到不懂的 → 搜索 → 沉淀。这从他前几轮的高质量反馈能看出(自己核验、自己写文档)。
- 现有课件是静态 HTML(已托管到 GitHub Pages),无后端。
- 已有可复用组件模式:quiz.js(每课一行 `<script>` 挂载)。笔记组件应沿用同样模式,保持一致性。

## Implications(设计决定)
1. **存储 = 浏览器 localStorage**。GitHub Pages 无后端,localStorage 是唯一现实选择。
   - 按课隔离:第 N 课的笔记 key = `lkl-notes:<filename>`,各自独立。
   - **代价**:不跨设备/浏览器自动同步。
2. **用 导出 JSON / 导入 / 复制为 Markdown 弥补同步缺口**。用户可以:
   - 导出 JSON 做备份;
   - 复制为 Markdown 粘进 git 仓库或学习文档,跟着 GitHub Pages 走。
3. **选中文字 → 自动引用**:贴合"读到不懂的句子 → 记录"的流程。用户选中一句,点"添加笔记",选中内容自动填进笔记的"上下文/引用"字段。
4. **复用约定**:每个课件只加一行 `<script src="../assets/notes.js" defer></script>` 即可启用,与 quiz.js 一致。
5. **打印时隐藏**(沿用 style.css 的 `@media print` 约定)。

## 待观察
- localStorage 容量(~5MB)对纯文本笔记绰绰有余,不会成为问题。
- 如果用户后续想要跨设备云同步,需要引入后端或 GitHub OAuth —— 当前 out of scope,导出/导入已能覆盖手动同步。
