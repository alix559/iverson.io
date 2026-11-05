# nadakit

Wav2vec 2.0 on [Modular MAX](https://docs.modular.com/max/), plus the embed engine and FastHTML app from [nadayantra](https://github.com/alix559/nadayantra). This is the package to install when you want the model and the sound-to-glyph runtime without checking out sibling repos.

The model is `facebook/wav2vec2-base-960h`: a convolutional feature encoder, a convolutional position embedding, and a 12-layer transformer, with a linear head that scores 32 characters for every 20 ms of audio. An embedding is the mean final hidden state over the clip, minus a fixed typical-audio vector (`embed_center.npy`), scaled to unit length.

## Install

```sh
pixi install
pixi run convert
```

`convert` downloads the checkpoint and writes `~/.cache/nadakit/models/wav2vec2.safetensors` plus the character vocabulary. Set `NADA_MODELS` to use a different directory.

As a dependency of another pixi project (MAX still comes from Modular's conda channel):

```toml
[workspace]
channels = ["https://conda.modular.com/max/", "conda-forge"]
platforms = ["osx-arm64"]

[dependencies]
python = "3.14.*"
max = ">=26.6.0,<27"

[pypi-dependencies]
nadakit = { git = "https://github.com/alix559/nadakit.git" }
```

Then `from nadakit import build, transcribe, Engine` and run `pixi run convert` once in this repo (or call `nadakit.download.download()`).

## Transcribe

```sh
pixi run transcribe clip.wav
```

The clip must be 16 kHz, 16-bit PCM WAV. The same thing from Python:

```python
from nadakit.features import read_wav
from nadakit.model import build, compile_model, load_checkpoint, transcribe

clip = read_wav("clip.wav")
model = build()
load_checkpoint(model)
compiled = compile_model(model, batch=1, num_samples=clip.size)
print(transcribe(model, compiled, [clip])[0])
```

## Embed

```python
from nadakit import Engine

engine = Engine()
vec = engine.embed(wave)  # 768-d unit vector
```

`Engine` compiles one graph per whole-second clip length and keeps the last four. `trim` cuts quiet lead-in and tail so a sound embeds the same however long you waited.

## Run the app

```sh
pixi run serve
```

The FastHTML app listens on <http://127.0.0.1:5001>. On macOS, `pixi install -e app` adds the Quartz bindings used to type into other apps and watch the hold-to-talk key.

The Observable frontend in `frontend/` is optional. `npm run build` there puts a static build at `/app/` when `frontend/dist` exists; `npm run dev` serves it on port 3000 against the API on 5001.

## Develop

This is an [nbdev](https://nbdev.fast.ai) project. Library code lives in notebooks under `nbs/` and is exported to the `nadakit` package:

```sh
pixi run nbdev-export
pixi run nbdev-test
```

`nada` and `nadayantra` stay as their own repos. They import this package for the shared model and embed path.
