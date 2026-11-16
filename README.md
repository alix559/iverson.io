# iverson.io

Desktop companion for the **[iverson.io](../iverson-ios)** iPhone/Mac app (`io.iverson.app`).

Speak **Sound Names** numbers (or glyph names like `plus`, `rho`) in the app. This project:

1. Lets you assign each glyph a **3-digit** number in a local web UI
2. Connects over **Bluetooth** to the app when **Link** is on
3. Types the matching glyph into the focused field on your Mac

Python package: **`iverson`**. CLIs: **`iverson`** (web UI) and **`iverson-receive`** (Bluetooth).

---

## What you need

| Piece | Role |
| --- | --- |
| **iverson.io app** (`iverson-ios`) | On-device speech → sends 3-digit codes / glyph names over BLE |
| **This repo** (`iverson-io`) | Web UI (number→glyph map) + `receive` (BLE central that types) |
| **macOS** | Bluetooth on; Accessibility so receive can type into other apps |

Speech stays on the phone. BLE only carries short text (codes / names) to the linked computer.

---

## Quick start

```sh
cd iverson-io
pixi install -e app
pixi run serve
```

In another terminal, after the app shows a link code:

```sh
pixi run receive --code 4821
```

Then: hold the **Talk key**, speak a 3-digit code in iverson.io, release — the glyph is typed.

---

## 1. Initialize the web UI (Sound Names)

The UI stores your number→glyph library in SQLite (`data/gnn.db` when developing from this checkout).

```sh
pixi install -e app
pixi run serve
```

Open **http://127.0.0.1:5001**

### Sound Names (`/names`)

1. Pick a glyph from the dropdown (or the glyph grid).
2. Enter a **1–3 digit** number (stored as a 3-digit code, e.g. `1` → `001`).
3. Click **Assign**.

Speak that number later in the app to type the glyph.

### Sound Keyboard (`/`)

- Lists every numbered glyph and what it types.
- Set the **Talk key** (Control, Option, Command, Shift, Space, Caps Lock, or Fn).
  Hold this key on the Mac while speaking; release to type into the focused app.
- Optional: override the typed key for a glyph (default is the glyph itself).

Leave `serve` running while you assign or change mappings. `receive` reads the same database.

---

## 2. Set up Bluetooth and permissions (Mac)

### Bluetooth

1. Turn **Bluetooth** on (System Settings → Bluetooth).
2. Keep the iPhone/Mac running **iverson.io** nearby and in the **foreground**.
3. In the app, tap **Link** — advertising starts as `iverson-XXXX` (your 4-digit code).

The GATT service UUID (shared with the Swift peripheral) is:

`6e616461-6b69-7400-4b42-000000000001`

Characteristic (UTF-8 notify):

`6e616461-6b69-7400-4b42-000000000002`

### Accessibility (required to type)

`receive` injects keystrokes via macOS Accessibility:

1. Start `pixi run receive --code …` once, or open Sound Keyboard and use the system prompt routes.
2. When macOS asks, allow **Terminal**, **iTerm**, or **Python** under  
   **System Settings → Privacy & Security → Accessibility**.
3. Focus a text field in the target app before speaking.

Without Accessibility, linking still works but nothing will be typed.

---

## 3. Connect with the iOS (or Mac) application

1. Build and run **iverson.io** from `../iverson-ios` (`Iverson.xcodeproj`) on iPhone or Mac.
2. Assign numbers in the web UI (section 1) if you have not already.
3. In the app, tap **Link** — note the **4-digit** code on screen (status: “Waiting for computer”).
4. On this Mac:

```sh
pixi run receive --code XXXX
```

Replace `XXXX` with the code from the app (example: `4821`).

5. When connected, the app shows **Linked**.
6. On the Mac, focus a text field and choose your **Talk key** in Sound Keyboard if needed.
7. **Hold the Talk key**, speak a **3-digit** code (e.g. “zero zero one”) or a glyph English name (`plus`, `rho`, …), then **release**.
8. When three digits are ready (or a name resolves), the glyph is typed.

Keep **Link** on and the app in the foreground while linked. If the scan fails, toggle Link for a fresh code and pass the new `--code`.

### Receive CLI options

```sh
pixi run receive --code 4821
pixi run receive --code 4821 --talk-key option
pixi run receive --code 4821 --no-talk-key    # type every code immediately
pixi run receive --code 4821 -v               # verbose BLE scan logs
pixi run receive --code 4821 --timeout 30
```

Without pixi:

```sh
pip install 'iverson[app]'
iverson-receive --code 4821
```

---

## End-to-end checklist

- [ ] `pixi install -e app`
- [ ] `pixi run serve` → http://127.0.0.1:5001 → assign at least one Sound Name
- [ ] Talk key set on Sound Keyboard
- [ ] Mac Bluetooth on; Accessibility granted to the shell/Python running receive
- [ ] iverson.io open, **Link** on, 4-digit code visible
- [ ] `pixi run receive --code <that code>` → logs show connected / subscribed
- [ ] Focus a text field → hold Talk key → speak `001` (or your code) → release → glyph appears

---

## Troubleshooting

| Symptom | What to try |
| --- | --- |
| Scan finds nothing | App foreground + Link on; Bluetooth on; retry with `-v`; toggle Link for a new code |
| Sees iverson service but wrong code | Use the **current** 4-digit code from the app |
| Connected but nothing typed | Grant Accessibility; hold Talk key while speaking; focus a text field |
| Wrong / no glyph | Confirm the 3-digit code exists under Sound Names; restart `receive` after changing the DB |
| Talk key ignored | Match the key in Sound Keyboard, or pass `--talk-key`; use `--no-talk-key` to bypass |

---

## Project layout

| Path | Purpose |
| --- | --- |
| `nbs/` | nbdev source (edit here, then export) |
| `iverson/` | Exported Python package |
| `data/gnn.db` | Local number→glyph library (dev checkout) |
| `frontend/` | Optional Observable UI (served when `frontend/dist` exists) |
| `../iverson-ios` | Swift app that advertises Link and sends spoken codes |

### Useful modules

- `iverson.main` — FastHTML app (`pixi run serve` / `iverson`)
- `iverson.receive` — BLE central (`pixi run receive` / `iverson-receive`)
- `iverson.bt` — shared service/characteristic UUIDs and peripheral name prefix
- `iverson.keys` — macOS typing + talk-key gate

---

## Develop

This is an [nbdev](https://nbdev.fast.ai) project. Edit notebooks under `nbs/`, then:

```sh
pixi run nbdev_export
```

Optional Observable frontend:

```sh
cd frontend && npm install && npm run build
```

When `frontend/dist` exists, the server serves it at `/`.
