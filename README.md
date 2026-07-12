# 图解 Linux 内核 · 学习课程

> 从**驱动移植**走向**内核 / BSP 工程师**。基于《图解Linux内核（基于 6.x）》（姜亚华，机械工业出版社，2024，对应 Linux 6.2）。
>
> 每课短小可一次完成：先给最小够用的知识，立刻进入一个能跑起来的动手实验（`.ko` 模块 / 内核命令），再用测验巩固。沿用「MCU 思维 ↔ 内核思维」对照，把裸机经验迁移成内核直觉。

---

## 🌐 在线访问（推荐）

课件为 HTML（带样式与交互测验），已通过 **GitHub Pages** 托管，浏览器直接打开即可：

| 入口 | 地址 |
|---|---|
| 🏠 **课程目录首页** | **https://nit78.github.io/linux-kernel-learning/** |
| 📖 第 1 课 · list_head 侵入式链表 | https://nit78.github.io/linux-kernel-learning/lessons/0001-intrusive-list-head.html |
| 📚 术语表（中英对照） | https://nit78.github.io/linux-kernel-learning/reference/glossary.html |

> 目录首页列出全部五篇主线与每课进度，新课件完成后自动上线（约 push 后 1 分钟）。
>
> 教材 PDF（53MB，受版权保护）**不包含在仓库内**，需自备。

### 在线访问地址规律

```
站点根:    https://nit78.github.io/linux-kernel-learning/
具体课件:  https://nit78.github.io/linux-kernel-learning/lessons/<NNNN>-<主题>.html
术语表:    https://nit78.github.io/linux-kernel-learning/reference/glossary.html
```

---

## 📑 课程主线

与主教材 5 篇 23 章对齐，逐课增量发布：

| 篇章 | 教材范围 | 内容 | 状态 |
|---|---|---|---|
| 一 · 知识储备 | §1–4 | 数据结构 / 中断 / 时间 — 打通 MCU→内核思维 | 🟢 **进行中** |
| 二 · 内存管理 | §5–9 | 页 / zone / buddy / slab / page fault — 驱动头号痛点 | ⚪ 待开始 |
| 三 · 文件系统 | §10–12 | VFS / sysfs / procfs / ext4 | ⚪ 待开始 |
| 四 · 进程管理 | §13–16 | task_struct / 调度器 / IPC / 信号 | ⚪ 待开始 |
| 五 · 综合应用 | §17–23 | ELF / epoll / 设备模型+V4L2 / KVM / virtio | ⚪ 待开始 |

最新进度以[在线目录首页](https://nit78.github.io/linux-kernel-learning/)为准。

---

## 📁 仓库结构

```
linux-kernel-learning/
├── index.html              # 🏠 课程目录首页 (Pages 根入口)
├── lessons/                # 课程 HTML 课件 (NNNN-主题.html)
│   └── 0001-intrusive-list-head.html
├── learning-records/       # 学习记录与遗留问题 (Markdown)
├── reference/
│   └── glossary.html       # 中英对照术语表
├── assets/                 # 共享前端资源
│   ├── style.css           #   Tufte 风格共享样式
│   └── quiz.js             #   交互测验组件
├── MISSION.md              # 学习目标 / 成功标准 / 边界
├── NOTES.md                # 教学偏好与课程笔记
├── RESOURCES.md            # 精选资源清单 (每条注明"何时取用")
├── COMMIT_CONVENTION.md    # 本仓库提交规范
└── git维护操作步骤.md       # git + Pages 维护流程
```

---

## 🔧 本地预览

无需服务器，直接用浏览器打开即可（所有路径均为相对路径）：

```bash
# 任选其一
start index.html              # Windows
open index.html               # macOS
xdg-open index.html           # Linux
```

若要带热重载开发，可用任意静态服务器：

```bash
python -m http.server 8000
# 浏览器访问 http://localhost:8000
```

---

## 📌 关于这个仓库

- **类型**：个人中文内核学习笔记与课件
- **可见性**：Public（GitHub Pages 免费托管的必要条件）
- **不包含**：教材 PDF（版权）、`.zcode/` 本地缓存、系统杂项（详见 `.gitignore`）
- **提交规范**：见 [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md) —— 每课交付含课件 / 术语 / 笔记 / 首页进度四个原子提交

---

*学习记录与课件持续更新中。*
