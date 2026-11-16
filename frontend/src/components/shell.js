// Nav + hero. Tabs switch views (#keys, #names) without unloading state.
import {html} from "npm:htl";
import {FileAttachment} from "observablehq:stdlib";

const HERO = {
  keys: ["Speak in notations.", "Hold the Talk key, speak a number in iverson.io, release — and it is typed."],
  names: ["Glyph library.", "basedpl English names (plus, rho, …) map directly when you speak them in iverson.io."]
};
const icon = await FileAttachment("../icon.png").url();
const TABS = [["keys", "Sound Keyboard"], ["names", "Sound Names"]];

export function shell(cur, invalidation, onSelect) {
  const tabs = html`<div></div>`, hero = html`<header class="hero"></header>`;
  function select(k, move = true) {
    if (!HERO[k]) k = "keys";
    cur = k;
    if (location.hash.slice(1) !== k) history.replaceState(null, "", "#" + k);
    tabs.replaceChildren(...TABS.map(([t, label]) => {
      const a = html`<a href=${"#" + t} aria-current=${t === cur ? "page" : null}>${label}</a>`;
      a.onclick = (e) => { e.preventDefault(); select(t); };
      return a;
    }));
    hero.replaceChildren(html`<h1>${HERO[k][0]}</h1>`, html`<p>${HERO[k][1]}</p>`);
    onSelect?.(k);
    if (move) {
      const el = document.getElementById(k);
      (el || hero).scrollIntoView({behavior: "smooth", block: "start"});
    }
  }
  const hash = () => select(location.hash.slice(1) || "keys", false);
  addEventListener("hashchange", hash);
  invalidation?.then(() => removeEventListener("hashchange", hash));
  hash();

  return html`<div>
    <nav class="top">
      <div><img src=${icon} alt=""><strong>iverson.io</strong></div>
      ${tabs}
    </nav>
    ${hero}
  </div>`;
}
