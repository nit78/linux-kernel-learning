# 提交规范 (Commit Convention)

> 本仓库的 git 提交约定。每课交付、资源维护、样式调整都按此规范,让历史可读、可回溯、可生成进度。

---

## 1. 提交信息格式

```
<type>: <简短描述, 中文, 句末不加句号>

<可选 body: 说明为什么改, 而不是改了什么>
```

### 1.1 type 类型表

| type | 用途 | 示例 |
|---|---|---|
| `lesson` | **新增一课** (lesson HTML + 配套资源) | `lesson: 第2课 hlist哈希链表与rbtree` |
| `notes` | 学习记录、笔记、反思类 Markdown | `notes: 第1课学习记录与未懂点` |
| `fix` | 修正已有内容的错误 (笔误/事实错误/链接失效) | `fix: 修正第1课 list_add 行为描述` |
| `refactor` | 重构不改内容 (HTML 结构、CSS 拆分) | `refactor: 拆分 callout 样式为独立组件` |
| `assets` | 共享资源改动 (style.css / quiz.js / glossary) | `assets: 新增打印友好的代码块样式` |
| `docs` | 非课程性文档 (MISSION/NOTES/本规范/RESOURCES) | `docs: 更新 RESOURCES 增补 Bootlin 链接` |
| `chore` | 工程杂项 (.gitignore / 配置 / Pages) | `chore: 排除新建的 .zcode 缓存` |

### 1.2 scope (可选, 用于进一步分类)

可在 type 后加 scope, 用 `/` 分隔, 主要给 lesson 用:

```
lesson/part1: 第3课 中断与上半部          ← 第一篇的课
lesson/part2: 第6课 物理内存模型          ← 第二篇的课
notes/quiz:   修订第2课测验选项等长        ← 针对测验的笔记
```

---

## 2. 描述行怎么写

**✅ 好的描述** (说清"是什么课/改了什么核心"):
```
lesson: 第2课 hlist哈希链表与rbtree
fix: 修正第1课 container_of 中 offsetof 的单位说明
assets: 为 pre 代码块增加可复制按钮
```

**❌ 不合格的描述** (模糊、只说文件名、混装):
```
update                          ← 更新了什么?
第1课                           ← 课的标题呢?
修改了 list_head.html           ← 改了啥?
fix typo and add quiz and ...   ← 多件事塞一个提交
```

### 2.1 body 写"为什么"

改动原因从 diff 看不出来时, 用 body 补充:

```
fix: 修正第1课 list_add 的输出顺序说明

原文写"顺序打印", 但头插法 list_add 实际是逆序 (BT-C→B→A)。
对照实验输出 (dmesg) 后订正, 避免误导。
```

---

## 3. 原子提交原则

**一个提交只做一件事。** 课程交付天然适合拆分:

### 3.1 一课的典型提交序列

交付第 N 课时, 按逻辑切成多个原子提交, 而不是一锅烩:

```bash
# ① 课件主体
git add lessons/000N-xxx.html
git commit -m "lesson/part1: 第N课 <主题>"

# ② 术语表更新 (如果有新术语)
git add reference/glossary.html
git commit -m "assets: 术语表增补 <术语> (第N课)"

# ③ 学习记录
git add learning-records/000N-xxx.md
git commit -m "notes: 第N课学习记录与遗留问题"

# ④ 首页进度徽章同步 (见第 4 节)
git add index.html
git commit -m "docs: 首页标记第N课完成, 更新进度"
```

> 为什么拆?——某一课的术语表改错了, 可以单独 revert, 不影响课件本体。
> 这是 git 历史可回溯的核心价值。

### 3.2 不要混装

| 反模式 | 正确做法 |
|---|---|
| 一个提交同时改了课件 + 全局 CSS + 笔记 | 拆 3 个提交 (lesson / assets / notes) |
| 顺手把别的课的错别字也改了塞进新课件 | 错别字单独一个 `fix:` 提交 |
| 格式化整个目录 + 加新内容 | 格式化 `refactor:` 单独提交 |

---

## 4. 每课必做:首页进度同步

**交付一课时, 必须同步更新 `index.html` 的徽章状态。** 这是一课"完成"的标志:

1. 该课 `<li>` 从 `class="todo"` 移除, 徽章改为 `<span class="badge done">已完成</span>`
2. 该课标题从纯文本改为 `<a href="lessons/000N-xxx.html">...</a>`
3. 下一课的徽章改为 `<span class="badge next">下一课</span>`
4. `hero` 区的进度 chip (已完成数 / 下一课) 同步更新
5. 进度条 `.progress-bar > span` 的 width 按比例更新

> 这个约定保证目录页始终反映真实进度, 也能从 git 历史看出"何时完成哪一课"。

---

## 5. 提交前检查清单

```bash
# 1. 看将要提交的内容, 确认无意外文件
git status --short

# 2. 确认没有大文件 / 敏感信息
git diff --cached | grep -iE "password|secret|api[_-]?key|token|\.pdf" && echo "⚠️ 检查" || echo "✓"

# 3. 提交信息是否用了规范 type
```

- [ ] 用了规范的 type (lesson/notes/fix/refactor/assets/docs/chore)
- [ ] 描述行说清了是什么课/什么改动
- [ ] 一个提交只做一件事 (原子提交)
- [ ] 无 PDF / 大文件 / 敏感信息混入
- [ ] 若是课程交付: 首页进度已同步 (第 4 节)

---

## 6. 文件命名约定

| 目录 | 命名 | 示例 |
|---|---|---|
| `lessons/` | `NNNN-kebab-主题.html` | `0003-interrupt-top-half.html` |
| `learning-records/` | `NNNN-kebab-主题.md` | `0001-prior-knowledge.md` |
| `assets/` | 全局共享, 小写 | `style.css`, `quiz.js` |
| `reference/` | 参考性页面 | `glossary.html` |

课程编号 `NNNN` 四位, 与 `index.html` 和主教材篇章节对应。

---

## 7. 推送与发布

```bash
git push
```

push 后 GitHub Pages 约 1 分钟自动重建, 新课件立即在线可见:
`https://nit78.github.io/linux-kernel-learning/lessons/000N-xxx.html`

构建状态查询:
```bash
"/c/Program Files/GitHub CLI/gh.exe" api repos/nit78/linux-kernel-learning/pages/builds/latest --jq '.status'
```

---

## 8. 常用场景速查

| 场景 | 命令 |
|---|---|
| 完成一课 | 见第 3.1 节的 4 步提交序列 |
| 改了个错别字 | `git commit -m "fix: 修正第N课 <位置> 的错别字"` |
| 新增共享样式 | `git commit -m "assets: <样式用途>"` |
| 更新资源清单 | `git commit -m "docs: RESOURCES 增补 <资源>"` |
| 撤销最后一个提交 (保留改动) | `git reset --soft HEAD~1` |
| 看历史 | `git log --oneline -20` |
