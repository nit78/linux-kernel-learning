# Git 维护操作步骤（学习项目通用）

> 基于实操整理的可复用流程。新学习项目照此从上到下执行即可。
> 前提：Windows + Git Bash + GitHub CLI(gh) 已安装并登录。

---

## 阶段 0：环境前置检查（只需做一次，后续项目跳过）

### 0.1 安装 GitHub CLI
```bash
winget install --id GitHub.cli --accept-source-agreements --accept-package-agreements
# 装完新开一个终端窗口, 让 PATH 生效
gh --version    # 验证
```

### 0.2 登录 GitHub（关键步骤，盯紧浏览器授权）
```bash
gh auth login
```
逐项选择：
| 提示 | 选 |
|---|---|
| Where do you use GitHub? | **GitHub.com** |
| Preferred protocol | **HTTPS** |
| Authenticate Git with credentials? | **Yes** |
| How to authenticate? | **Login with a web browser** |

然后：
1. 终端显示 `! First copy your one-time code: XXXX-XXXX` → **先记下代码**
2. 按回车 → 浏览器打开 `https://github.com/login/device`（没自动开就手动输入网址）
3. 粘贴代码 → Continue → 选账号 → **点 Authorize github**
4. **必须看到**这两行才算成功：
   ```
   ✓ Authentication complete.
   ✓ Logged in as <你的用户名>
   ```

### 0.3 验证登录
```bash
gh auth status
# 看到 ✓ Logged in to github.com account <用户名> 即成功
```

> ⚠️ 如果 `auth status` 仍显示未登录，说明浏览器授权没走完，重做 0.2。
> 终端必须出现 ✓ 两行才算数。

---

## 阶段 1：初始化本地仓库

### 1.1 进入项目目录
```bash
cd "你的项目路径"
```

### 1.2 创建 `.gitignore`（按项目实际情况调整排除项）
新建 `.gitignore`，典型内容：
```gitignore
# ===== 大文件 / 受版权材料 =====
*.pdf

# ===== 编辑器 / IDE =====
.vscode/
.idea/
*.swp
*~
.DS_Store
Thumbs.db
desktop.ini

# ===== ZCode / AI 工具本地缓存 =====
.zcode/

# ===== 系统杂项 =====
ehthumbs.db
$RECYCLE.BIN/
```

> 💡 大文件（教材 PDF、视频等）一律排除——git 不适合存大文件，
> 想跟踪大文件用 Git LFS，但 push 到远端有配额限制。

### 1.3 创建 `.gitattributes`（统一换行符，Windows 协作必备）
```
* text=auto eol=lf
*.md   text eol=lf
*.html text eol=lf
*.css  text eol=lf
*.js   text eol=lf
*.pdf  binary
```

### 1.4 初始化仓库
```bash
git init -b main                          # 默认分支设为 main
git config --local core.autocrlf true     # Windows 换行处理
git config --local core.safecrlf warn
```

> 身份信息(user.name / user.email)用全局配置即可，无需每个仓库重设：
> `git config --global user.name "你的名字"` （只设一次）

### 1.5 暂存 + 检查将要提交的内容（**重要：提交前必看**）
```bash
git add -A
git status --short                        # 逐一核对文件清单
```

### 1.6 提交前安全检查
```bash
# 确认大文件没被暂存
git status --short | grep -iE "pdf|mp4|zip" && echo "⚠️ 有大文件" || echo "✓ 无大文件"
# 敏感信息扫描
git diff --cached | grep -iE "password|secret|api[_-]?key|token" && echo "⚠️ 疑似敏感信息" || echo "✓ 无敏感信息"
# 查看改动统计
git diff --cached --stat
```

### 1.7 创建首个提交
```bash
git commit -m "chore: 初始化 <项目名> 仓库

纳入首批材料:
- <列出主要文件/目录>

配套工程文件:
- .gitignore 排除 <大文件/缓存等>
- .gitattributes 统一换行符为 LF"
```

> 提交信息规范：`<type>: <描述>`，type 用 feat / fix / refactor / docs / chore / test。
> lesson 类项目可用自定义前缀如 `lesson:`、`notes:`。

---

## 阶段 2：接上 GitHub 远端

### 2.1 一条命令建仓 + push
```bash
gh repo create <仓库名> --public --source=. --remote=origin --push \
  --description "<一句话描述>"
```
参数说明：
- `--public` 公开（**免费账号想用 Pages 必须公开**）
- `--private` 私有（无法用免费 Pages，仅备份/版本同步）
- `--source=.` 用当前目录
- `--push` 创建后立即推送

### 2.2 验证同步
```bash
git remote -v                              # 看远端地址
git status -sb                             # 应显示 ## main...origin/main 无 ahead/behind
gh api repos/<用户名>/<仓库名>/git/trees/main --jq '.tree[].path'  # 远端文件清单
```

---

## 阶段 3：开启 GitHub Pages（可选，想做网页访问才需要）

> 前提：仓库必须 **public**（免费账号）。

### 3.1 用 gh API 一键开启
```bash
gh api --method POST repos/<用户名>/<仓库名>/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

### 3.2 查看构建状态（约 1-2 分钟）
```bash
gh api repos/<用户名>/<仓库名>/pages --jq '{url: .html_url, status: .status}'
gh api repos/<用户名>/<仓库名>/pages/builds/latest --jq '.status'
# status=built 表示构建完成
```

### 3.3 验证页面可访问
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://<用户名>.github.io/<仓库名>/<文件>.html"
# HTTP 200 = 成功
```

### 3.4 访问地址规律
```
站点根:   https://<用户名>.github.io/<仓库名>/
具体文件: https://<用户名>.github.io/<仓库名>/<路径>/<文件>.html
```

> ⚠️ 根路径若无 `index.html` 会返回 404，**这是正常的**，不影响具体文件访问。
> 想要根路径有目录页，自己做一个 `index.html` 放仓库根。

---

## 阶段 4：日常维护工作流

每次写完一课/一次笔记：
```bash
git add <新文件或改动的文件>
git status --short                 # 核对暂存内容
git commit -m "lesson: 第N课 <主题>"
git push                           # 推送后 Pages 约 1 分钟自动更新
```

---

## 常用排查命令速查

| 场景 | 命令 |
|---|---|
| 看提交历史 | `git log --oneline -20` |
| 看某个文件改了啥 | `git diff <文件>` |
| 放弃未提交的改动 | `git checkout -- <文件>` |
| 撤销最后一次提交(保留改动) | `git reset --soft HEAD~1` |
| 回退到某个提交 | `git reset --hard <commit>`（⚠️ 不可逆） |
| 看 Pages 构建状态 | `gh api repos/<u>/<r>/pages/builds/latest --jq .status` |
| 重新触发 Pages 构建 | `gh api --method POST repos/<u>/<r>/pages/builds` |

---

## 决策清单（动手前先想清楚）

1. **大文件怎么处理？** → 默认 `.gitignore` 排除，需多机同步再考虑 Git LFS
2. **仓库公开还是私有？**
   - 想要网页访问(Pages) + 免费账号 → 必须 **public**
   - 只想备份/版本同步，不公开 → **private**（放弃 Pages）
   - 课件想公开、笔记想私密 → 拆成**两个仓库**
3. **要不要 Pages？** → 有 HTML 课件想要在线浏览就开；只有 Markdown 则不必（github.com 直接渲染 MD）
