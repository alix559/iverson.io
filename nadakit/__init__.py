"""Wav2vec 2.0 on Modular MAX, plus the embed engine and FastHTML app from nadayantra

[Wav2vec 2.0](https://arxiv.org/abs/2006.11477) on [Modular MAX](https://docs.modular.com/max/). This package combines the `nada` model API with the embed runtime that `nadayantra` and the gananayantra helper each used to keep a copy of.

An embedding is the mean final hidden state over the clip, minus a fixed typical-audio vector (`embed_center.npy`), scaled to unit length.

Modules:

- `nadakit.audio`: Wav2vec 2.0 encoder, as `Wav2Vec2Model` runs it at inference.
- `nadakit.config`: Shapes for the wav2vec 2.0 base checkpoint.
- `nadakit.download`: Download `facebook/wav2vec2-base-960h` and write a numpy checkpoint.
- `nadakit.features`: Waveform preparation and CTC decoding for the wav2vec 2.0 checkpoint.
- `nadakit.layers`: Building blocks the MAX graph needs that are not in `max.experimental.nn`.
- `nadakit.make_center`: Compute the "typical audio" vector that `Engine.embed` subtracts.
- `nadakit.model`: Wav2vec 2.0 with a CTC head.
- `nadakit.warm`: Compile the CPU graphs the app actually runs.
- `nadakit.weights`: Load a wav2vec 2.0 state dict onto the MAX module."""

__version__ = "0.1.0"

__all__ = [
    "Engine",
    "Nada",
    "Wav2Vec2Config",
    "Wav2Vec2ForCTC",
    "base_960h_config",
    "build",
    "compile_model",
    "models_dir",
    "tiny_config",
    "transcribe",
    "trim",
]

# Loaded on first use, so `import nadakit.learn` does not pull Modular MAX.
_lazy = {
    "Engine": ("engine", "Engine"),
    "Nada": ("engine", "Nada"),
    "trim": ("engine", "trim"),
    "Wav2Vec2Config": ("config", "Wav2Vec2Config"),
    "base_960h_config": ("config", "base_960h_config"),
    "tiny_config": ("config", "tiny_config"),
    "models_dir": ("core", "models_dir"),
    "Wav2Vec2ForCTC": ("model", "Wav2Vec2ForCTC"),
    "build": ("model", "build"),
    "compile_model": ("model", "compile_model"),
    "transcribe": ("model", "transcribe"),
}

def __getattr__(name):
    if name not in _lazy:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    import importlib
    module, attr = _lazy[name]
    value = getattr(importlib.import_module(f".{module}", __name__), attr)
    globals()[name] = value
    return value

def __dir__():
    return sorted(set(globals()) | set(_lazy))
