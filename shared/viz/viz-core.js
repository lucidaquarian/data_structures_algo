/* viz-core.js — shared visualization building blocks.
 *
 *   ArrayView : draws a dynamic array (allocated slots + stored value cells,
 *               annotated with size/capacity brackets) using D3, and animates
 *               operation highlights with anime.js.
 *   Stepper   : a generic play / step / speed engine. An operation is a list of
 *               steps; each step names the code lines to highlight, a caption,
 *               and an async `run` that mutates the model and animates.
 *
 * Reused unchanged by every module's visualize.html.
 */
(function (global) {
  "use strict";

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const TAG = { read: "read", write: "write", move: "moved", new: "inserted", copy: "copied" };

  class ArrayView {
    constructor(svgSelector, opts = {}) {
      this.o = Object.assign(
        {
          cell: 62,
          gap: 14,
          padX: 30,
          sizeLabelY: 14,
          sizeBrkY: 30,
          cellY: 48,
          dur: 520,
        },
        opts
      );
      this.speed = 1;
      this.svg = d3.select(svgSelector);

      const defs = this.svg.append("defs");
      defs.html(
        '<filter id="cellShadow" x="-40%" y="-40%" width="180%" height="180%">' +
          '<feDropShadow dx="0" dy="2" stdDeviation="3.5" flood-color="rgba(20,30,60,0.16)"/>' +
          "</filter>"
      );

      this.brkG = this.svg.append("g").attr("class", "brackets");
      this.slotsG = this.svg.append("g").attr("class", "slots");
      this.idxG = this.svg.append("g").attr("class", "labels");
      this.valsG = this.svg.append("g").attr("class", "vals");
      this.fxG = this.svg.append("g").attr("class", "fx");

      this._els = [];
      this._cap = 0;
    }

    _x(i) {
      return this.o.padX + i * (this.o.cell + this.o.gap);
    }
    _dur(animate) {
      return animate ? this.o.dur / this.speed : 0;
    }
    setSpeed(s) {
      this.speed = s;
    }

    _layout(capacity) {
      const o = this.o;
      const idxY = o.cellY + o.cell + 18;
      const capBrkY = o.cellY + o.cell + 34;
      const capLabelY = capBrkY + 18;
      const right = o.padX + Math.max(capacity - 1, 0) * (o.cell + o.gap) + o.cell;
      const w = right + o.padX;
      const h = capLabelY + 12;
      this.svg.attr("viewBox", `0 0 ${Math.max(w, 300)} ${h}`);
      return { idxY, capBrkY, capLabelY, right };
    }

    /** Bracket path: a flat span with short ticks at both ends.
     *  dir = +1 ticks point down, -1 ticks point up. */
    _bracketPath(xL, xR, y, dir) {
      const t = 6 * dir;
      return `M${xL},${y + t} L${xL},${y} L${xR},${y} L${xR},${y + t}`;
    }

    /** Render `elements` (array of {id, value, pending?}) in a backing store of
     *  `capacity` slots, keyed by id so moves animate smoothly. */
    render(elements, capacity, animate = true) {
      this._els = elements;
      this._cap = capacity;
      const o = this.o;
      const cs = o.cell;
      const y = o.cellY;
      const dur = this._dur(animate);
      const L = this._layout(capacity);
      const slots = d3.range(capacity);

      // --- allocated slots ---
      const sSel = this.slotsG.selectAll("rect.slot").data(slots, (d) => d);
      sSel.exit().transition().duration(dur).style("opacity", 0).remove();
      sSel
        .enter()
        .append("rect")
        .attr("class", "slot")
        .attr("y", y)
        .attr("width", cs)
        .attr("height", cs)
        .attr("rx", 12)
        .attr("x", (d) => this._x(d))
        .style("opacity", 0)
        .merge(sSel)
        .transition()
        .duration(dur)
        .attr("x", (d) => this._x(d))
        .attr("y", y)
        .style("opacity", 1);

      // --- index labels ---
      const iSel = this.idxG.selectAll("text.idx").data(slots, (d) => d);
      iSel.exit().remove();
      iSel
        .enter()
        .append("text")
        .attr("class", "idx")
        .attr("text-anchor", "middle")
        .text((d) => d)
        .merge(iSel)
        .transition()
        .duration(dur)
        .attr("x", (d) => this._x(d) + cs / 2)
        .attr("y", L.idxY)
        .tween("t", function (d) {
          const self = this;
          return () => {
            self.textContent = d;
          };
        });

      // --- value cells ---
      const vSel = this.valsG.selectAll("g.vcell").data(elements, (d) => d.id);
      vSel
        .exit()
        .classed("pending", false)
        .transition()
        .duration(dur)
        .style("opacity", 0)
        .attr("transform", (d, i) => `translate(${this._x(i)},${y + 14})`)
        .remove();
      const vEnter = vSel
        .enter()
        .append("g")
        .attr("class", "vcell")
        .attr("transform", (d, i) => `translate(${this._x(i)},${y + 12})`)
        .style("opacity", 0);
      vEnter
        .append("rect")
        .attr("width", cs)
        .attr("height", cs)
        .attr("rx", 12)
        .attr("filter", "url(#cellShadow)");
      vEnter
        .append("text")
        .attr("class", "val")
        .attr("x", cs / 2)
        .attr("y", cs / 2 + 1)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central");

      const vMerge = vEnter.merge(vSel);
      vMerge.classed("pending", (d) => !!d.pending);
      vMerge.select("text.val").text((d) => (d.pending ? "" : d.value));
      vMerge
        .transition()
        .duration(dur)
        .style("opacity", 1)
        .attr("transform", (d, i) => `translate(${this._x(i)},${y})`);

      // --- size & capacity brackets ---
      this._brackets(elements.length, capacity, L, dur);
    }

    _brackets(size, capacity, L, dur) {
      const o = this.o;
      const cs = o.cell;
      const capL = this._x(0);
      const capR = this._x(capacity - 1) + cs;
      const parts = [];
      parts.push({
        key: "cap",
        cls: "cap",
        d: this._bracketPath(capL, capR, L.capBrkY, -1),
        lx: (capL + capR) / 2,
        ly: L.capLabelY,
        text: `capacity = ${capacity}`,
        show: capacity > 0,
      });
      const sizeR = size > 0 ? this._x(size - 1) + cs : capL;
      parts.push({
        key: "size",
        cls: "size",
        d: this._bracketPath(capL, sizeR, o.sizeBrkY, 1),
        lx: (capL + sizeR) / 2,
        ly: o.sizeLabelY,
        text: `size = ${size}`,
        show: size > 0,
      });

      const pSel = this.brkG.selectAll("path.bracket").data(parts, (d) => d.key);
      pSel
        .enter()
        .append("path")
        .attr("class", (d) => "bracket " + d.cls)
        .merge(pSel)
        .style("opacity", (d) => (d.show ? 1 : 0))
        .transition()
        .duration(dur)
        .attr("d", (d) => d.d);

      const tSel = this.brkG.selectAll("text.brk-label").data(parts, (d) => d.key);
      tSel
        .enter()
        .append("text")
        .attr("class", (d) => "brk-label " + d.cls)
        .attr("text-anchor", "middle")
        .merge(tSel)
        .text((d) => d.text)
        .style("opacity", (d) => (d.show ? 1 : 0))
        .transition()
        .duration(dur)
        .attr("x", (d) => d.lx)
        .attr("y", (d) => d.ly);
    }

    /** Pulse a stored value cell by id, with a floating tag naming the action. */
    pulseValue(id, kind = "read") {
      const idx = this._els.findIndex((e) => e.id === id);
      const sel = this.valsG.selectAll("g.vcell").filter((d) => d.id === id);
      const rect = sel.select("rect").node();
      const cx = this._x(Math.max(idx, 0)) + this.o.cell / 2;
      return this._glow(sel, rect, cx, this.o.cellY, kind, TAG[kind]);
    }

    /** Pulse an allocated slot by index (used for the resize copy step). */
    pulseSlot(index, kind = "copy") {
      const node = this.slotsG.selectAll("rect.slot").nodes()[index];
      const cx = this._x(index) + this.o.cell / 2;
      return this._glow(d3.select(node), node, cx, this.o.cellY, kind, TAG[kind]);
    }

    _glow(sel, scaleTarget, cx, topY, kind, tagText) {
      if (sel.empty() || !scaleTarget) return Promise.resolve();
      const cls = "pulse-" + kind;
      sel.classed(cls, true);
      const dur = 700 / this.speed;

      let tag = null;
      if (tagText) {
        const w = 14 + tagText.length * 6.6;
        tag = this.fxG
          .append("g")
          .attr("class", "fxtag " + kind)
          .attr("transform", `translate(${cx},${topY - 8})`)
          .style("opacity", 0);
        tag.append("rect").attr("x", -w / 2).attr("y", -18).attr("width", w).attr("height", 18).attr("rx", 6);
        tag
          .append("text")
          .attr("text-anchor", "middle")
          .attr("y", -5)
          .text(tagText);
        tag.transition().duration(dur * 0.35).style("opacity", 1);
        tag
          .transition()
          .delay(dur * 0.35)
          .duration(dur * 0.65)
          .ease(d3.easeCubicOut)
          .attr("transform", `translate(${cx},${topY - 24})`)
          .style("opacity", 0)
          .remove();
      }

      return new Promise((res) => {
        const done = () => {
          sel.classed(cls, false);
          res();
        };
        if (global.anime) {
          global.anime({
            targets: scaleTarget,
            scale: [1, 1.12, 1],
            duration: dur,
            easing: "easeOutBack",
            complete: done,
          });
        } else {
          setTimeout(done, dur);
        }
      });
    }
  }

  /* Generic play / step / speed engine. */
  class Stepper {
    constructor({ codePanel, onCaption, onModelChange, onRunState }) {
      this.codePanel = codePanel;
      this.onCaption = onCaption || (() => {});
      this.onModelChange = onModelChange || (() => {});
      this.onRunState = onRunState || (() => {});
      this.steps = [];
      this.idx = 0;
      this.playing = false;
      this.speed = 1;
      this.gap = 440;
    }

    load(steps) {
      this.steps = steps;
      this.idx = 0;
      this.playing = false;
      this.onRunState({ playing: false, atEnd: steps.length === 0, loaded: true });
    }

    setSpeed(s) {
      this.speed = s;
    }

    get atEnd() {
      return this.idx >= this.steps.length;
    }

    async _one() {
      if (this.atEnd) return false;
      const s = this.steps[this.idx];
      if (this.codePanel) this.codePanel.highlight(s.lines || []);
      this.onCaption(s.caption || "", this.idx + 1, this.steps.length);
      if (s.run) await s.run();
      this.onModelChange();
      this.idx++;
      return true;
    }

    async step() {
      if (this.playing || this.atEnd) return;
      await this._one();
      this.onRunState({ playing: false, atEnd: this.atEnd, loaded: true });
      if (this.atEnd && this.codePanel) this.codePanel.clear();
    }

    async play() {
      if (this.playing || this.atEnd) return;
      this.playing = true;
      this.onRunState({ playing: true, atEnd: false, loaded: true });
      while (this.playing && !this.atEnd) {
        await this._one();
        if (!this.atEnd) await sleep(this.gap / this.speed);
      }
      this.playing = false;
      this.onRunState({ playing: false, atEnd: this.atEnd, loaded: true });
      if (this.atEnd && this.codePanel) this.codePanel.clear();
    }

    pause() {
      this.playing = false;
    }
  }

  global.ArrayView = ArrayView;
  global.Stepper = Stepper;
  global.vizSleep = sleep;
})(window);
