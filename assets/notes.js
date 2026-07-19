/* =============================================================================
   图解 Linux 内核课程 · 共享笔记组件 (assets/notes.js)
   用法：每个课件加一行即可启用（与 quiz.js 一致）：
     <script src="../assets/notes.js" defer></script>

   功能：
   - 右下角悬浮按钮开关笔记抽屉；按钮上显示本课笔记数。
   - 在正文中选中一段文字 → 弹出"+ 记为笔记"小气泡 → 自动把选中内容作为引用，
     新建一条空笔记，进入编辑态，等你写下搜来的解释。
   - 每条笔记：编辑 / 删除 / 单条复制为 Markdown。
   - 抽屉底部：添加空笔记 / 导出 JSON 备份 / 导入 JSON / 复制全部为 Markdown。
   - 存储于浏览器 localStorage，按课隔离。key = "lkl-notes:" + 课件文件名。
   - 打印时隐藏（见 style.css 的 @media print）。

   数据结构（一条笔记）：
     { id: string, quote: string, body: string, ts: number }
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- 常量与工具 ---------- */
  // 用课件文件名作为 key 的后缀，保证每课独立。location.pathname 末段即文件名。
  function pageKey() {
    var path = window.location.pathname || "";
    var name = path.substring(path.lastIndexOf("/") + 1) || "lesson";
    return "lkl-notes:" + name;
  }
  function nowId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function formatTs(ts) {
    try {
      var d = new Date(ts);
      var pad = function (n) { return n < 10 ? "0" + n : n; };
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
             " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    } catch (e) { return ""; }
  }
  // 笔记标题（文件名去掉扩展名，如 0003-rbtree.html → "0003-rbtree"）
  function lessonTitle() {
    var path = window.location.pathname || "";
    var name = path.substring(path.lastIndexOf("/") + 1);
    return name.replace(/\.html?$/i, "") || "本课";
  }

  /* ---------- 存储读写 ---------- */
  function loadNotes() {
    try {
      var raw = localStorage.getItem(pageKey());
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveNotes(arr) {
    try { localStorage.setItem(pageKey(), JSON.stringify(arr)); }
    catch (e) { /* 配额满或隐私模式，静默失败 */ }
  }

  /* ---------- DOM 构建 ---------- */
  var fab, drawer, backdrop, listEl, countEl, popEl;

  function buildShell() {
    // 悬浮按钮
    fab = document.createElement("button");
    fab.className = "notes-fab";
    fab.type = "button";
    fab.title = "打开笔记";
    fab.innerHTML =
      '<span class="fab-icon">✎</span>' +
      '<span>笔记</span>' +
      '<span class="fab-count"></span>';
    fab.addEventListener("click", function () { openDrawer(); });

    // 遮罩
    backdrop = document.createElement("div");
    backdrop.className = "notes-backdrop";
    backdrop.addEventListener("click", function () { closeDrawer(); });

    // 抽屉
    drawer = document.createElement("aside");
    drawer.className = "notes-drawer";
    drawer.setAttribute("aria-label", "学习笔记");
    drawer.innerHTML =
      '<div class="notes-header">' +
        '<div><h3>学习笔记</h3>' +
        '<span class="notes-sub">本课：<code id="notes-lesson-name"></code> · 存于本浏览器</span></div>' +
        '<button class="notes-close" type="button" title="关闭" aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="notes-list" id="notes-list"></div>' +
      '<div class="notes-footer">' +
        '<button class="primary" id="notes-add" type="button">＋ 新建笔记</button>' +
        '<button id="notes-copy-md" type="button">复制为 Markdown</button>' +
        '<button id="notes-export" type="button">导出 JSON</button>' +
        '<label>导入 JSON<input type="file" id="notes-import" accept="application/json,.json"></label>' +
      '</div>';
    document.body.appendChild(fab);
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    drawer.querySelector("#notes-lesson-name").textContent = lessonTitle();
    listEl = drawer.querySelector("#notes-list");
    countEl = fab.querySelector(".fab-count");

    drawer.querySelector(".notes-close").addEventListener("click", closeDrawer);
    drawer.querySelector("#notes-add").addEventListener("click", function () {
      addNote("", "", true); // 新建空笔记并立即编辑
    });
    drawer.querySelector("#notes-copy-md").addEventListener("click", copyAllAsMarkdown);
    drawer.querySelector("#notes-export").addEventListener("click", exportJson);
    drawer.querySelector("#notes-import").addEventListener("change", importJson);

    // Esc 关闭
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
    });
  }

  /* ---------- 渲染 ---------- */
  function refreshCount() {
    var n = loadNotes().length;
    countEl.textContent = n > 0 ? n : "";
  }

  function renderList() {
    var notes = loadNotes();
    if (notes.length === 0) {
      listEl.innerHTML =
        '<div class="notes-empty">' +
        '<span class="big">📝</span>' +
        '还没有笔记。<br>' +
        '读到不懂的地方，<strong>选中那句话</strong>，会弹出"+ 记为笔记"。<br>' +
        '或在下面点"＋ 新建笔记"。' +
        '</div>';
      refreshCount();
      return;
    }
    // 按 id（即创建顺序的近似）倒序：最新的在上
    notes.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    listEl.innerHTML = notes.map(renderCard).join("");
    bindCardEvents();
    refreshCount();
  }

  function renderCard(note) {
    return (
      '<div class="note-card" data-id="' + escapeHtml(note.id) + '">' +
        (note.quote
          ? '<div class="note-quote">' + escapeHtml(note.quote) + '</div>'
          : '') +
        '<div class="note-body" data-role="body">' + escapeHtml(note.body) + '</div>' +
        '<div class="note-meta">' +
          '<span>' + formatTs(note.ts) + '</span>' +
          '<span class="note-actions">' +
            '<button type="button" data-act="edit">编辑</button>' +
            '<button type="button" data-act="copy">复制</button>' +
            '<button type="button" data-act="del" class="del">删除</button>' +
          '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function bindCardEvents() {
    listEl.querySelectorAll(".note-card").forEach(function (card) {
      var id = card.getAttribute("data-id");
      card.querySelector('[data-act="edit"]').addEventListener("click", function () { editCard(id); });
      card.querySelector('[data-act="copy"]').addEventListener("click", function () { copyOne(id); });
      card.querySelector('[data-act="del"]').addEventListener("click", function () { delNote(id); });
    });
  }

  /* ---------- 增删改 ---------- */
  function addNote(quote, body, editRightNow) {
    var notes = loadNotes();
    var note = { id: nowId(), quote: quote || "", body: body || "", ts: Date.now() };
    notes.push(note);
    saveNotes(notes);
    renderList();
    if (editRightNow) {
      // 滚到顶部（新建的在最上）并立即进入编辑
      var card = listEl.querySelector('.note-card[data-id="' + cssEscape(note.id) + '"]');
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        enterEdit(card);
      }
    }
  }

  function delNote(id) {
    if (!confirm("删除这条笔记？")) return;
    var notes = loadNotes().filter(function (n) { return n.id !== id; });
    saveNotes(notes);
    renderList();
  }

  function editCard(id) {
    var card = listEl.querySelector('.note-card[data-id="' + cssEscape(id) + '"]');
    if (card) enterEdit(card);
  }

  // 进入编辑态：把 .note-body 换成 textarea + 保存/取消按钮
  function enterEdit(card) {
    if (card.getAttribute("data-editing") === "1") return;
    card.setAttribute("data-editing", "1");

    var id = card.getAttribute("data-id");
    var note = loadNotes().filter(function (n) { return n.id === id; })[0];
    var bodyEl = card.querySelector('[data-role="body"]');
    var prev = note ? note.body : "";

    var area = document.createElement("textarea");
    area.className = "note-edit-area";
    area.value = prev;
    area.placeholder = "写下你搜来的理解、自己的话、相关链接…（支持换行）";
    bodyEl.replaceWith(area);
    area.focus();

    var actions = card.querySelector(".note-actions");
    var orig = actions.innerHTML;
    actions.innerHTML =
      '<button type="button" data-act="save" class="">保存</button>' +
      '<button type="button" data-act="cancel" class="">取消</button>';
    actions.querySelector('[data-act="save"]').addEventListener("click", function () {
      var notes = loadNotes();
      var n = notes.filter(function (x) { return x.id === id; })[0];
      if (n) { n.body = area.value; n.ts = Date.now(); }
      saveNotes(notes);
      card.removeAttribute("data-editing");
      renderList();
    });
    actions.querySelector('[data-act="cancel"]').addEventListener("click", function () {
      card.removeAttribute("data-editing");
      renderList();
    });
  }

  function copyOne(id) {
    var note = loadNotes().filter(function (n) { return n.id === id; })[0];
    if (!note) return;
    var md = noteToMarkdown(note);
    copyText(md, "已复制这条笔记（Markdown）");
  }

  /* ---------- 导出 / 导入 / 全部复制 ---------- */
  function exportJson() {
    var notes = loadNotes();
    if (notes.length === 0) { toast("本课还没有笔记可导出"); return; }
    var payload = {
      lesson: lessonTitle(),
      exportedAt: new Date().toISOString(),
      notes: notes
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "notes-" + lessonTitle() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importJson(ev) {
    var file = ev.target.files && ev.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var incoming = Array.isArray(data) ? data : data.notes;
        if (!Array.isArray(incoming)) throw new Error("格式不对");
        var notes = loadNotes();
        var existingIds = new Set(notes.map(function (n) { return n.id; }));
        var added = 0;
        incoming.forEach(function (n) {
          if (n && typeof n.body === "string") {
            // 防止 id 冲突
            var nid = n.id || nowId();
            while (existingIds.has(nid)) nid = nid + "_x";
            existingIds.add(nid);
            notes.push({ id: nid, quote: n.quote || "", body: n.body, ts: n.ts || Date.now() });
            added++;
          }
        });
        saveNotes(notes);
        renderList();
        toast("已导入 " + added + " 条笔记");
      } catch (e) {
        alert("导入失败：" + (e.message || "文件不是合法的笔记 JSON"));
      }
      ev.target.value = ""; // 允许再次选同一个文件
    };
    reader.readAsText(file);
  }

  function copyAllAsMarkdown() {
    var notes = loadNotes();
    if (notes.length === 0) { toast("本课还没有笔记"); return; }
    notes.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
    var md = "# 笔记：" + lessonTitle() + "\n\n" +
             notes.map(noteToMarkdown).join("\n\n");
    copyText(md, "已复制全部笔记为 Markdown（共 " + notes.length + " 条）");
  }

  function noteToMarkdown(note) {
    var parts = [];
    if (note.quote) parts.push("> " + note.quote.replace(/\n/g, "\n> "));
    parts.push(note.body || "_(空)_");
    parts.push("<sub>" + formatTs(note.ts) + "</sub>");
    return parts.join("\n\n");
  }

  /* ---------- 抽屉开关 ---------- */
  function openDrawer() {
    drawer.classList.add("open");
    backdrop.classList.add("show");
    renderList();
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    backdrop.classList.remove("show");
    dismissPop();
  }

  /* ---------- 选中文字 → 弹"+ 记为笔记" ---------- */
  function onSelectionChange() {
    dismissPop();
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    var text = sel.toString().trim();
    if (text.length < 2 || text.length > 400) return; // 太短或太长都不弹

    // 只在 .wrap 内的选择才弹（避免选中代码块外的 UI 文本）
    var range = sel.getRangeAt(0);
    var wrap = document.querySelector(".wrap");
    if (!wrap || !wrap.contains(range.commonAncestorContainer)) return;

    var rect = range.getBoundingClientRect();
    showPop(rect.left + rect.width / 2, rect.top + window.scrollY, text);
  }

  function showPop(centerX, topY, text) {
    dismissPop();
    popEl = document.createElement("button");
    popEl.type = "button";
    popEl.className = "notes-pop";
    popEl.textContent = "＋ 记为笔记";
    popEl.style.left = "0px";
    popEl.style.top = "0px";
    document.body.appendChild(popEl);
    // 居中定位（在选中区上方）
    var w = popEl.offsetWidth;
    var h = popEl.offsetHeight;
    popEl.style.left = Math.max(8, centerX - w / 2) + "px";
    popEl.style.top = Math.max(8, topY - h - 8) + "px";
    popEl.addEventListener("mousedown", function (e) { e.preventDefault(); }); // 防丢选区
    popEl.addEventListener("click", function () {
      addNote(text, "", true);
      try { window.getSelection().removeAllRanges(); } catch (e) {}
      dismissPop();
      if (!drawer.classList.contains("open")) openDrawer();
    });
  }
  function dismissPop() {
    if (popEl && popEl.parentNode) popEl.parentNode.removeChild(popEl);
    popEl = null;
  }

  /* ---------- 小工具：toast / 复制 / cssEscape ---------- */
  function toast(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText =
      "position:fixed;left:50%;bottom:2rem;transform:translateX(-50%);" +
      "background:#1a1a1a;color:#fff;padding:.6rem 1.1rem;border-radius:20px;" +
      "font-family:var(--sans);font-size:.85rem;z-index:2000;opacity:0;" +
      "transition:opacity .2s;box-shadow:0 4px 14px rgba(0,0,0,.25);";
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = "1"; });
    setTimeout(function () {
      t.style.opacity = "0";
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
    }, 1800);
  }

  function copyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, function () { fallbackCopy(text, okMsg); });
    } else {
      fallbackCopy(text, okMsg);
    }
  }
  function fallbackCopy(text, okMsg) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast(okMsg); } catch (e) { toast("复制失败，请手动选中文本复制"); }
    document.body.removeChild(ta);
  }

  function cssEscape(s) {
    // 简易转义，用于 querySelector；id 由我们生成（base36），实际很安全
    return String(s).replace(/["\\]/g, "\\$&");
  }

  /* ---------- 初始化 ---------- */
  function init() {
    buildShell();
    refreshCount();
    // 选中文字弹气泡：mouseup / keyup 后检查（兼容鼠标和键盘选词）
    document.addEventListener("mouseup", function () {
      // 略微延迟，让 selection 更新到位
      setTimeout(onSelectionChange, 10);
    });
    document.addEventListener("selectionchange", function () {
      // 仅当抽屉里的元素不是焦点时才处理，避免与编辑冲突
      var ae = document.activeElement;
      if (ae && (ae.tagName === "TEXTAREA" || ae.tagName === "INPUT")) return;
      // selectionchange 频繁，节流一下
      if (onSelectionChange._t) clearTimeout(onSelectionChange._t);
      onSelectionChange._t = setTimeout(onSelectionChange, 200);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
