// Sound Keyboard: permissions for receive + talk key + number→glyph map.
import {html} from "npm:htl";
import {get, post} from "./api.js";
import {hue, keyPick} from "./ui.js";

const DEFAULT_TALK_KEYS = [
  {id: "ctrl", label: "Control"},
  {id: "option", label: "Option"},
  {id: "command", label: "Command"},
  {id: "shift", label: "Shift"},
  {id: "space", label: "Space"},
  {id: "caps", label: "Caps Lock"},
  {id: "fn", label: "Fn"},
];

export async function keyboard(app, invalidation) {
  const ss = app.sounds || [];
  const keyed = ss.filter((s) => s.types);
  let sys = await get("/sys/status").catch(() => ({available: false, type: false}));
  let talkKey = app.talk_key || "ctrl";
  let talkKeys = app.talk_keys?.length ? app.talk_keys : DEFAULT_TALK_KEYS;

  const kst = html`<div class="msg"></div>`;
  const say = (m, k = "") => { kst.className = `msg ${k}`; kst.textContent = m; };

  const typeSw = html`<input type="checkbox" class="switch" role="switch" aria-label="Type into other apps" ${sys.type ? "checked" : ""}>`;
  const btBtn = html`<button type="button" class="outline sm">Open Bluetooth settings</button>`;
  const talkSel = html`<select class="talk-key" aria-label="Talk key">
    ${talkKeys.map((k) => html`<option value=${k.id} selected=${k.id === talkKey}>${k.label}</option>`)}
  </select>`;

  function paintPerms() {
    typeSw.checked = !!sys.type;
    if (!sys.available) {
      say("On this machine, run pixi run receive. macOS permissions are only needed there.", "");
      return;
    }
    say(sys.type
      ? "Accessibility on — receive can type into the focused app."
      : "Turn on “Type into other apps” so receive can type glyphs (macOS Accessibility).",
      sys.type ? "ok" : "warn");
  }

  typeSw.onchange = async () => {
    if (!typeSw.checked) {
      say("Accessibility stays on in System Settings until you turn it off there.", "warn");
      typeSw.checked = !!sys.type;
      return;
    }
    sys = await post("/sys/prompt");
    paintPerms();
    if (!sys.type) {
      say("Allow your terminal (the one running receive/serve) under Privacy & Security → Accessibility, then try again.", "err");
    }
  };

  btBtn.onclick = async () => {
    await post("/sys/bluetooth").catch(() => {});
    say("Bluetooth settings opened. Keep Bluetooth on, then run pixi run receive with iverson.io Link enabled.", "ok");
  };

  talkSel.onchange = async () => {
    try {
      const res = await post("/api/talkkey", {v: talkSel.value});
      talkKey = res.talk_key || talkSel.value;
      if (res.talk_keys?.length) talkKeys = res.talk_keys;
      const lab = (talkKeys.find((k) => k.id === talkKey) || {}).label || talkKey;
      say(`Talk key set to ${lab}. Hold it while speaking in iverson.io, then release to type.`, "ok");
    } catch (e) {
      say("Could not save talk key. Is the server running?", "err");
      talkSel.value = talkKey;
    }
  };

  paintPerms();
  invalidation?.then?.(() => {});

  const panel = html`<div class="panel">
    <div class="ctl">
      <div class="lbl">
        <strong>Sound keyboard</strong>
        <small>Speak a number in iverson.io (Link on). <code>pixi run receive --code …</code> types the glyph.</small>
      </div>
    </div>
    <label class="ctl">
      <div class="lbl">
        <strong>Talk key</strong>
        <small>Hold this key on the Mac while you speak; release to type into the focused field.</small>
      </div>
      ${talkSel}
    </label>
    ${sys.available ? html`<label class="ctl">
      <div class="lbl">
        <strong>Type into other apps</strong>
        <small>macOS Accessibility — required for receive to type. Allow the terminal running this server.</small>
      </div>
      ${typeSw}
    </label>` : ""}
    <div class="ctl">
      <div class="lbl">
        <strong>Bluetooth</strong>
        <small>Must be on so receive can find iverson.io. Keep Link on in the phone/Mac app.</small>
      </div>
      ${btBtn}
    </div>
  </div>`;

  const ready = html`<div class="msg ${keyed.length ? "ok" : "warn"}">${
    keyed.length
      ? `${keyed.length} number${keyed.length === 1 ? "" : "s"} ready to type.`
      : "No numbers yet. Assign a number to each glyph on the Sound Names page."
  }</div>`;

  const list = keyed.length
    ? html`<div>
        <h4 class="sec">Numbers and what they type</h4>
        ${keyed.map((s, i) => html`<div class="row" style=${hue(i, keyed.length)}>
          <span>${s.glyph}</span><strong>${s.name}</strong>
          <small>${s.cps || ""}</small><small>→ ${s.label || s.types}</small>${keyPick(s, app.sp)}
        </div>`)}
      </div>`
    : html`<p class="empty">Assign a number to each glyph on the Sound Names page. Speak that number in iverson.io to type it.</p>`;

  return html`<div>${panel}${kst}${ready}${list}</div>`;
}
