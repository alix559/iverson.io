// The microphone: raw samples from an audio worklet, resampled to 16 kHz when you stop.
// start({begin, progress, end, send, fail, seconds}) records until stop() or `seconds` elapse.
// send gets the audio as base64 16-bit PCM.
import {say} from "./store.js";

export const REC_SECONDS = 4; // teaching and recognition stop on their own at this cap; you can stop sooner
const MAX_SECONDS = 10; // keyboard cap
let ctx, stream, node, chunks = [], frames = 0, on = false, cur = null, busy = false, keep = false, epoch = 0;

export const current = () => cur;
export const isBusy = () => busy || !!cur;

// Keep the microphone open between recordings (the sound keyboard does); otherwise it closes after each one.
export function keepOpen(v) {
  keep = v;
  if (!v && !cur && !busy) close();
}

export async function open() {
  if (ctx) return ctx.resume();
  if (!navigator.mediaDevices?.getUserMedia) throw Error("This browser can't use the microphone here. Open the app at http://localhost:5001/.");
  try {
    stream = await navigator.mediaDevices.getUserMedia({audio: {channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false}});
  } catch (e) {
    throw Error(e.name == "NotAllowedError" ? "Microphone access is off. Allow it in your browser's site settings." : e.message);
  }
  ctx = new AudioContext();
  const code = `registerProcessor('cap', class extends AudioWorkletProcessor {
    constructor() { super(); this.rec = false; this.epoch = 0; this.port.onmessage = (e) => { this.rec = !!e.data.rec; if ('epoch' in e.data) this.epoch = e.data.epoch; }; }
    process(i) { if (!this.rec) return true; const c = i[0] && i[0][0]; c && this.port.postMessage({samples: c.slice(), epoch: this.epoch}); return true; }
  })`;
  await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([code], {type: "text/javascript"})));
  node = new AudioWorkletNode(ctx, "cap");
  ctx.createMediaStreamSource(stream).connect(node);
  node.connect(ctx.destination); // it writes no output, but it only runs while connected
  node.port.onmessage = (e) => {
    const d = e.data;
    if (!on || d.epoch !== epoch) return;
    chunks.push(d.samples);
    frames += d.samples.length;
    const level = Math.min(1, Math.sqrt(d.samples.reduce((a, x) => a + x * x, 0) / d.samples.length) * 8);
    const t = frames / ctx.sampleRate, limit = cur.seconds ?? MAX_SECONDS;
    cur?.progress?.(level, t);
    if (t >= limit) stop();
  };
}

export function close() {
  stream?.getTracks().forEach((t) => t.stop());
  ctx?.close();
  ctx = stream = null;
}

async function to16k(x, rate) {
  if (rate == 16000) return x;
  const off = new OfflineAudioContext(1, Math.ceil((x.length * 16000) / rate), 16000), buf = off.createBuffer(1, x.length, rate);
  buf.copyToChannel(x, 0);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start();
  return (await off.startRendering()).getChannelData(0);
}

function b64(x) {
  const pcm = Int16Array.from(x, (v) => Math.max(-1, Math.min(1, v)) * 32767), u8 = new Uint8Array(pcm.buffer);
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function start(spec) {
  if (cur || busy) return;
  busy = true; // while the microphone starts
  try {
    await open();
  } catch (e) {
    return (spec.fail ?? ((m) => say(m, "err")))(e.message);
  } finally {
    busy = false;
  }
  epoch += 1;
  chunks = []; frames = 0; on = true; cur = spec;
  node.port.postMessage({rec: true, epoch});
  document.body.classList.add("rec");
  spec.begin?.();
}

export async function stop() {
  const s = cur;
  if (!s) return;
  cur = null; on = false; busy = true;
  node?.port.postMessage({rec: false});
  document.body.classList.remove("rec");
  s.end?.();
  try {
    const x = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
    let i = 0;
    chunks.forEach((c) => { x.set(c, i); i += c.length; });
    const audio = b64(await to16k(x, ctx.sampleRate));
    if (!keep) close();
    await s.send(audio);
  } catch (e) {
    (s.fail ?? ((m) => say(m, "err")))(e.message);
  } finally {
    busy = false;
  }
}
