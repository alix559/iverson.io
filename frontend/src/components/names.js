// Sound Names: type a number for each glyph (no microphone).
import {html} from "npm:htl";
import {post} from "./api.js";
import {sections, G, refresh, say} from "./store.js";
import {hue, keyPick} from "./ui.js";

let sel = "";

export function banner(app) {
  return html`<small class="trained">Type a number for a glyph. Speak that number in Transcribe to type it on the PC.</small>`;
}

export function controls(sp) {
  // Filled by library() so the selected tile stays in sync with the form.
  return html`<form class="bar num-form" id="num-form" onsubmit=${onSubmit}>
    <label>Glyph
      <select name="sym" id="num-sym" required>
        <option value="">Choose a glyph…</option>
        ${sections.flatMap(({title, glyphs}) =>
          html`<optgroup label=${title}>${glyphs.map((g) =>
            html`<option value=${g.sym}>${g.sym}  ${g.iast} — ${g.mean}</option>`)}</optgroup>`)}
      </select>
    </label>
    <label>Number
      <input name="name" id="num-name" type="text" inputmode="numeric" pattern="[0-9]+" placeholder="e.g. 1" required autocomplete="off">
    </label>
    <button class="lg" type="submit">Assign</button>
  </form>`;
}

async function onSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const sym = String(fd.get("sym") || "");
  const name = String(fd.get("name") || "").trim();
  if (!sym || !name) return;
  const r = await post("/api/assign", {sym, name});
  say(r.msg, r.ok ? "ok" : "err");
  if (r.ok) {
    sel = sym;
    e.target.querySelector("#num-name").value = name;
  }
  await refresh();
}

export function recog(app) {
  return html`<div class="recog"></div>`;
}

function syncForm(sym, name = "") {
  const form = document.getElementById("num-form");
  if (!form) return;
  const symEl = form.querySelector("#num-sym");
  const nameEl = form.querySelector("#num-name");
  if (symEl) symEl.value = sym || "";
  if (nameEl && document.activeElement !== nameEl) nameEl.value = name;
}

export function library(app, mode, setMode) {
  const det = html`<div class="det"></div>`;

  function detail() {
    const g = G.get(sel);
    if (!g) return det.replaceChildren();
    const s = app.sounds.find((x) => x.glyph === sel);
    syncForm(sel, s?.name ?? "");
    det.replaceChildren(
      html`<div class="glyph">${g.sym}</div>`,
      html`<div><strong>${g.iast}  ${g.dev}</strong><br>${g.mean}<br><small>${g.sec}</small>
        ${s ? html`<br><small>number <b>${s.name}</b> → types ${s.label}</small>` : html`<br><small>No number yet — use the form above.</small>`}</div>`,
      html`<div class="acts">${s
        ? [keyPick(s, app.sp),
           html`<button class="outline" type="button" onclick=${async () => { await post("/api/forget", {id: s.id}); await refresh(); }}>Forget</button>`]
        : null}</div>`);
  }

  function tile(g, i, n, s) {
    const cls = s ? "taught" : "";
    const el = html`<div class="tile ${cls} ${g.sym === sel ? "sel" : ""}" style=${hue(i, n)} role="button" tabindex="0"
        data-sym=${g.sym} title=${`${g.sym}  ${g.mean}${s ? `  #${s.name}` : ""}`}><small>${s ? `#${s.name}` : g.mean}</small><b>${g.sym}</b><i>${g.iast}</i></div>`;
    el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } };
    el.onclick = () => {
      document.querySelectorAll(".tile.sel").forEach((x) => x.classList.remove("sel"));
      el.classList.add("sel");
      sel = g.sym;
      detail();
      const nameEl = document.getElementById("num-name");
      nameEl?.focus();
      nameEl?.select();
      el.scrollIntoView({behavior: "smooth", block: "center"});
    };
    return el;
  }

  const tabs = html`<div class="tabs" role="group">${[["g", "Glyphs"], ["l", "All numbers"]].map(([v, t]) =>
    html`<button type="button" class=${mode === v ? "" : "outline"} onclick=${() => setMode(v)}>${t}</button>`)}</div>`;

  let body;
  if (mode === "g") {
    const by = new Map(app.sounds.filter((s) => s.glyph).map((s) => [s.glyph, s]));
    body = [...sections.map(({title, glyphs}) => html`<div>
      <h4 class="sec">${title}<small>${glyphs.filter((g) => by.has(g.sym)).length} of ${glyphs.length} numbered</small></h4>
      <div class="tiles">${glyphs.map((g, i) => tile(g, i, glyphs.length, by.get(g.sym)))}</div></div>`), det];
    detail();
  } else {
    const ss = app.sounds;
    body = ss.length
      ? [html`<h4 class="sec">Numbered glyphs (${ss.length})<button class="outline sm" type="button" onclick=${async () => { if (confirm("Forget every mapping?")) { await post("/api/forgetall"); await refresh(); } }}>Remove All</button></h4>`,
         ...ss.map((s, i) => html`<div class="row" style=${hue(i, ss.length)}>
            <span>~</span><span>${s.glyph}</span>
            <input value=${s.name} placeholder="Number" inputmode="numeric" aria-label="Number" onchange=${async (e) => {
              const r = await post("/api/rename", {id: s.id, v: e.target.value});
              if (!r.ok) say(r.msg || "Rename failed", "err");
              await refresh();
            }}>
            <small>types ${s.label}</small>${keyPick(s, app.sp)}
            <button class="outline" type="button" title="Forget this mapping" onclick=${async () => { await post("/api/forget", {id: s.id}); await refresh(); }}>×</button></div>`)]
      : [html`<p class="empty">No numbers yet. Choose a glyph in the form above and type a number.</p>`];
  }
  return html`<div>${tabs}${body}</div>`;
}
