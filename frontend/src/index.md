---
title: iverson.io
---

```js
import {shell} from "./components/shell.js";
import {keyboard} from "./components/keyboard.js";
import {controls, library, banner} from "./components/names.js";
import {get} from "./components/api.js";
import {notice} from "./components/ui.js";
import {subscribe} from "./components/store.js";

const app = Generators.observe((notify) => subscribe(notify));
const mode = Mutable("g");
const setMode = (v) => (mode.value = v);
```

```js
const views = {keys: html`<div id="keys"></div>`, names: html`<div id="names"></div>`};
const show = (k) => { for (const [n, v] of Object.entries(views)) v.hidden = n !== k; };
display(shell("keys", invalidation, show));
display(views.keys);
display(views.names);
```

```js
const kbBox = html`<div></div>`;
views.keys.replaceChildren(kbBox);
```

```js
kbBox.replaceChildren(await keyboard(app, invalidation));
```

```js
const notes = html`<div></div>`, lib = html`<div></div>`;
views.names.replaceChildren(controls((await get("/api/state")).sp), notes, lib);
```

```js
notes.replaceChildren(notice(app), banner(app));
lib.replaceChildren(library(app, mode, setMode));
```
