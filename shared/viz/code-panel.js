/* code-panel.js — renders a read-only source listing and highlights lines in
 * sync with an animation.
 *
 * The visualization never hard-codes line numbers (those drift whenever the
 * source changes). Instead each animation step names a unique snippet of code,
 * and `lineOf(snippet, method)` resolves it to a line number at run time. If a
 * snippet can't be found, it throws loudly — that's your signal the animation
 * and the source have drifted apart and need reconciling.
 */
(function (global) {
  "use strict";

  const KEYWORDS = new Set([
    "def", "return", "if", "elif", "else", "for", "while", "in", "range",
    "raise", "class", "None", "True", "False", "and", "or", "not", "is",
    "import", "from", "as", "with", "yield", "pass", "break", "continue",
    "self", "staticmethod", "property", "lambda", "try", "except", "finally",
  ]);

  function esc(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Highlight one physical line of Python. `state.triple` carries an open
  // triple-quote delimiter across lines so multi-line docstrings render right.
  function highlightLine(raw, state) {
    let out = "";
    let i = 0;
    const n = raw.length;

    if (state.triple) {
      const idx = raw.indexOf(state.triple);
      if (idx < 0) {
        return { html: `<span class="s">${esc(raw)}</span>` || "&nbsp;", state };
      }
      out += `<span class="s">${esc(raw.slice(0, idx + state.triple.length))}</span>`;
      i = idx + state.triple.length;
      state = { triple: null };
    }

    while (i < n) {
      const c = raw[i];

      if (c === "#") {                       // comment runs to end of line
        out += `<span class="c">${esc(raw.slice(i))}</span>`;
        i = n;
        break;
      }

      if (c === '"' || c === "'") {          // string literal
        const t3 = raw.substr(i, 3);
        if (t3 === c + c + c) {               // triple-quoted
          const close = raw.indexOf(t3, i + 3);
          if (close < 0) {
            out += `<span class="s">${esc(raw.slice(i))}</span>`;
            return { html: out || "&nbsp;", state: { triple: t3 } };
          }
          out += `<span class="s">${esc(raw.slice(i, close + 3))}</span>`;
          i = close + 3;
          continue;
        }
        let j = i + 1;                        // single-line string
        while (j < n) {
          if (raw[j] === "\\") { j += 2; continue; }
          if (raw[j] === c) { j++; break; }
          j++;
        }
        out += `<span class="s">${esc(raw.slice(i, j))}</span>`;
        i = j;
        continue;
      }

      if (/[A-Za-z_]/.test(c)) {              // identifier / keyword
        let j = i + 1;
        while (j < n && /[A-Za-z0-9_]/.test(raw[j])) j++;
        const w = raw.slice(i, j);
        out += KEYWORDS.has(w) ? `<span class="k">${w}</span>` : esc(w);
        i = j;
        continue;
      }

      if (/[0-9]/.test(c)) {                  // number
        let j = i + 1;
        while (j < n && /[0-9._]/.test(raw[j])) j++;
        out += `<span class="n">${esc(raw.slice(i, j))}</span>`;
        i = j;
        continue;
      }

      out += esc(c);
      i++;
    }

    return { html: out || "&nbsp;", state };
  }

  class CodePanel {
    constructor(container, sourceText) {
      this.container =
        typeof container === "string"
          ? document.querySelector(container)
          : container;
      this.lines = sourceText.replace(/\s+$/, "").split("\n");
      this._indexMethods();
      this._render();
    }

    // Map each `def name(` to the [start, end] line range of its body so a
    // snippet search can be scoped to one method (many snippets repeat across
    // methods, e.g. `self._size += 1`).
    _indexMethods() {
      this.methods = {};
      const defs = [];
      this.lines.forEach((line, idx) => {
        const m = line.match(/^(\s*)def\s+(\w+)/);
        if (m) defs.push({ name: m[2], indent: m[1].length, start: idx });
      });
      defs.forEach((d, k) => {
        let end = this.lines.length - 1;
        for (let j = d.start + 1; j < this.lines.length; j++) {
          const line = this.lines[j];
          if (line.trim() === "") continue;
          const indent = line.match(/^\s*/)[0].length;
          if (indent <= d.indent) { end = j - 1; break; }
        }
        this.methods[d.name] = [d.start, end];
      });
    }

    _render() {
      const ol = document.createElement("ol");
      ol.className = "code";
      this.lineEls = [];
      let state = { triple: null };
      this.lines.forEach((raw, idx) => {
        const li = document.createElement("li");
        li.className = "code-line";
        const num = document.createElement("span");
        num.className = "ln";
        num.textContent = idx + 1;
        const code = document.createElement("code");
        const res = highlightLine(raw, state);
        state = res.state;
        code.innerHTML = res.html;
        li.appendChild(num);
        li.appendChild(code);
        ol.appendChild(li);
        this.lineEls.push(li);
      });
      this.container.innerHTML = "";
      this.container.appendChild(ol);
    }

    /** 1-based line number of the first line containing `snippet`.
     *  Pass `method` to restrict the search to one method body. */
    lineOf(snippet, method) {
      let lo = 0;
      let hi = this.lines.length - 1;
      if (method) {
        const range = this.methods[method];
        if (!range) throw new Error(`unknown method: ${method}`);
        [lo, hi] = range;
      }
      for (let i = lo; i <= hi; i++) {
        if (this.lines[i].includes(snippet)) return i + 1;
      }
      throw new Error(
        `code snippet not found${method ? ` in ${method}()` : ""}: "${snippet}"`
      );
    }

    /** Highlight the given 1-based line numbers and scroll the first into view. */
    highlight(lines) {
      this.clear();
      (lines || []).forEach((ln) => {
        const el = this.lineEls[ln - 1];
        if (el) el.classList.add("active");
      });
      if (lines && lines.length) {
        const first = this.lineEls[lines[0] - 1];
        if (first) first.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }

    clear() {
      this.lineEls.forEach((el) => el.classList.remove("active"));
    }
  }

  global.CodePanel = CodePanel;
})(window);
