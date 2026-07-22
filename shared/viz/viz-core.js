/* viz-core.js — shared visualization building blocks.
 *
 *   ArrayView : draws a dynamic array (allocated slots + stored value cells)
 *               with D3, and animates highlights with anime.js.
 *   Stepper   : a generic play / step / speed engine. An operation is a list of
 *               steps; each step names the code lines to highlight, a caption,
 *               and an async `run` that mutates the model and animates.
 *
 * Both are dependency-light and reused by every module's visualize.html.
 */
(function (global) {
  "use strict";

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  class ArrayView {
    constructor(svgSelector, opts = {}) {
      this.o = Object.assign(
        { cell: 56, gap: 12, padX: 20, padY: 40, dur: 480 },
        opts
      );
      this.speed = 1;
      this.svg = d3.select(svgSelector);
      this.slotsG = this.svg.append("g").attr("class", "slots");
      this.idxG = this.svg.append("g").attr("class", "labels");
      this.valsG = this.svg.append("g").attr("class", "vals");
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

    _resizeCanvas(capacity) {
      const w = this.o.padX * 2 + capacity * (this.o.cell + this.o.gap);
      const h = this.o.padY + this.o.cell + 34;
      this.svg.attr("viewBox", `0 0 ${Math.max(w, 300)} ${h}`);
    }

    /** Render `elements` (array of {id, value, pending?}) sitting in a backing
     *  store of `capacity` slots. Keyed by id so moves animate smoothly. */
    render(elements, capacity, animate = true) {
      this._resizeCanvas(capacity);
      const y = this.o.padY;
      const cs = this.o.cell;
      const dur = this._dur(animate);
      const slots = d3.range(capacity);

      // Allocated slots (the backing store).
      const sSel = this.slotsG.selectAll("rect.slot").data(slots, (d) => d);
      sSel.exit().transition().duration(dur).style("opacity", 0).remove();
      sSel
        .enter()
        .append("rect")
        .attr("class", "slot")
        .attr("y", y)
        .attr("width", cs)
        .attr("height", cs)
        .attr("rx", 8)
        .attr("x", (d) => this._x(d))
        .style("opacity", 0)
        .merge(sSel)
        .transition()
        .duration(dur)
        .attr("x", (d) => this._x(d))
        .attr("y", y)
        .style("opacity", 1);

      // Index labels under each slot.
      const iSel = this.idxG.selectAll("text.idx").data(slots, (d) => d);
      iSel.exit().remove();
      iSel
        .enter()
        .append("text")
        .attr("class", "idx")
        .attr("text-anchor", "middle")
        .merge(iSel)
        .transition()
        .duration(dur)
        .attr("x", (d) => this._x(d) + cs / 2)
        .attr("y", y + cs + 20)
        .tween("text", function (d) {
          return () => {
            this.textContent = d;
          };
        });

      // Stored value cells.
      const vSel = this.valsG.selectAll("g.vcell").data(elements, (d) => d.id);
      vSel
        .exit()
        .classed("pending", false)
        .transition()
        .duration(dur)
        .style("opacity", 0)
        .remove();
      const vEnter = vSel
        .enter()
        .append("g")
        .attr("class", "vcell")
        .attr("transform", (d, i) => `translate(${this._x(i)},${y})`)
        .style("opacity", 0);
      vEnter
        .append("rect")
        .attr("width", cs)
        .attr("height", cs)
        .attr("rx", 8);
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
    }

    /** Pulse the value cell with the given id. `kind` picks the color/label. */
    pulseValue(id, kind = "read") {
      return this._pulse(
        this.valsG.selectAll("g.vcell").filter((d) => d.id === id),
        kind,
        true
      );
    }

    /** Pulse an allocated slot by index (used for the resize copy step). */
    pulseSlot(index, kind = "copy") {
      const nodes = this.slotsG.selectAll("rect.slot").nodes();
      return this._pulse(d3.select(nodes[index]), kind, false);
    }

    _pulse(selection, kind, scale) {
      if (selection.empty()) return Promise.resolve();
      const cls = "pulse-" + kind;
      selection.classed(cls, true);
      const dur = 620 / this.speed;
      return new Promise((res) => {
        if (scale && global.anime) {
          const rect = selection.select("rect").node();
          global.anime({
            targets: rect,
            scale: [1, 1.14, 1],
            duration: dur,
            easing: "easeInOutQuad",
            complete: () => {
              selection.classed(cls, false);
              res();
            },
          });
        } else {
          setTimeout(() => {
            selection.classed(cls, false);
            res();
          }, dur);
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
      this.gap = 420;
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
