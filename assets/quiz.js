/* =============================================================================
   图解 Linux 内核课程 · 共享测验组件 (assets/quiz.js)
   用法（HTML 约定，样式见 style.css 的 .quiz-* 段）：

     <div class="quiz" data-correct="b" data-explain="解释文本">
       <p class="quiz-q">问题文本</p>
       <label class="quiz-opt"><input type="radio" name="q1" value="a">选项 A</label>
       <label class="quiz-opt"><input type="radio" name="q1" value="b">选项 B</label>
       <label class="quiz-opt"><input type="radio" name="q1" value="c">选项 C</label>
       <label class="quiz-opt"><input type="radio" name="q1" value="d">选项 D</label>
       <button class="quiz-check">提交</button>
       <div class="quiz-feedback"></div>
     </div>

   规则：
   - 选项文本应等长，避免用长度/格式泄露答案（见 NOTES.md 教学约定）。
   - data-correct 是正确选项的 value；data-explain 是答后给出的解释。
   - 提交后锁定该题，标出对错与解释，支持重置（清空选择再来一次）。
   自动扫描页面上所有 .quiz，无需手动初始化。
   ========================================================================== */

(function () {
  "use strict";

  function initQuiz(quiz) {
    if (quiz.dataset.bound === "1") return;
    quiz.dataset.bound = "1";

    var correct = quiz.dataset.correct;        // 正确选项 value
    var explain = quiz.dataset.explain || "";  // 解释文本
    var options = quiz.querySelectorAll(".quiz-opt");
    var inputs  = quiz.querySelectorAll(".quiz-opt input");
    var btn     = quiz.querySelector(".quiz-check");
    var feedback = quiz.querySelector(".quiz-feedback");

    // 若 HTML 里没放反馈容器，自动补一个
    if (!feedback) {
      feedback = document.createElement("div");
      feedback.className = "quiz-feedback";
      quiz.appendChild(feedback);
    }

    // 选中态视觉：点击任一选项，把 .selected 标到对应 label
    inputs.forEach(function (input) {
      input.addEventListener("change", function () {
        options.forEach(function (o) { o.classList.remove("selected"); });
        if (input.checked) input.closest(".quiz-opt").classList.add("selected");
        btn.disabled = false;
      });
    });

    // 提交
    btn.disabled = true;
    btn.addEventListener("click", function () {
      var chosen = quiz.querySelector(".quiz-opt input:checked");
      if (!chosen) return;

      var isRight = chosen.value === correct;
      // 标记每个选项
      options.forEach(function (opt) {
        var inp = opt.querySelector("input");
        opt.classList.add("locked");
        if (inp.value === correct) opt.classList.add("correct");
        if (inp.checked && !isRight) opt.classList.add("wrong");
        inp.disabled = true;
      });

      feedback.className = "quiz-feedback show " + (isRight ? "ok" : "no");
      feedback.innerHTML =
        (isRight ? "<b>✓ 正确。</b> " : "<b>✗ 再想想。</b> ") +
        (explain || "");

      btn.disabled = true;
      btn.textContent = "已作答";

      // 追加一个"重做"按钮，方便反复练习（检索练习）
      if (!quiz.querySelector(".quiz-redo")) {
        var redo = document.createElement("button");
        redo.type = "button";
        redo.className = "quiz-check quiz-redo";
        redo.style.marginLeft = ".6rem";
        redo.style.background = "transparent";
        redo.style.color = "var(--ink-soft)";
        redo.style.border = "1px solid var(--rule)";
        redo.textContent = "重做";
        redo.addEventListener("click", function () { reset(quiz); });
        btn.parentNode.insertBefore(redo, btn.nextSibling);
      }
    });
  }

  function reset(quiz) {
    var options = quiz.querySelectorAll(".quiz-opt");
    var inputs  = quiz.querySelectorAll(".quiz-opt input");
    var btn     = quiz.querySelector(".quiz-check");
    var feedback = quiz.querySelector(".quiz-feedback");

    inputs.forEach(function (inp) {
      inp.disabled = false;
      inp.checked = false;
    });
    options.forEach(function (o) {
      o.classList.remove("selected", "locked", "correct", "wrong");
    });
    feedback.className = "quiz-feedback";
    feedback.innerHTML = "";
    btn.disabled = true;
    btn.textContent = "提交";
    var redo = quiz.querySelector(".quiz-redo");
    if (redo) redo.remove();
  }

  function initAll() {
    document.querySelectorAll(".quiz").forEach(initQuiz);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
