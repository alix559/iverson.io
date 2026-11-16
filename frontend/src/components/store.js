// Server state: number→glyph mappings. Pages subscribe and re-render on change.
import {get} from "./api.js";

export const state = {
  sounds: [], sp: {},
  talk_key: "ctrl",
  talk_keys: [],
  notice: null  // {msg, kind}
};

export const sections = await get("/api/glyphs").catch(() => []);
export const G = new Map(sections.flatMap((s) => s.glyphs.map((g) => [g.sym, {...g, sec: s.title}])));

const subs = new Set();
const emit = () => { const s = {...state}; subs.forEach((f) => f(s)); };

export function subscribe(f) {
  subs.add(f);
  f({...state});
  return () => subs.delete(f);
}

export async function refresh() {
  try {
    Object.assign(state, await get("/api/state"));
  } catch (e) {
    state.notice = {msg: "The server isn't reachable. Start it with: pixi run serve", kind: "err"};
  }
  emit();
}

export function say(msg, kind = "") {
  state.notice = msg ? {msg, kind} : null;
  emit();
}

// Initial load
refresh();
