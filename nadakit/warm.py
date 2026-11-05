"""Compile the CPU graphs the app actually runs.

`max warm-interpreter-cache` builds every op family for every device. This
only traces wav2vec 2.0 for 1- and 2-second clips on CPU — the lengths
`Engine` pads to — so the interpreter ops that compile hits get cached,
and GPU / unused families stay cold.

    pixi run warm
    python -m nadakit.warm [--force]
"""

from __future__ import annotations

import argparse
import importlib.metadata
from pathlib import Path

from .core import models_dir
from .engine import SAMPLE_RATE, WARM_SECONDS
from .model import build, compile_model

SECONDS = (1, WARM_SECONDS)


def _stamp_path() -> Path:
    return models_dir() / ".warm"


def _signature() -> str:
    try:
        version = importlib.metadata.version("max")
    except importlib.metadata.PackageNotFoundError:
        version = "unknown"
    lengths = ",".join(f"{n}s" for n in SECONDS)
    return f"max={version};device=cpu;graphs={lengths}\n"


def already_warm() -> bool:
    path = _stamp_path()
    return path.is_file() and path.read_text() == _signature()


def warm(*, force: bool = False) -> None:
    if not force and already_warm():
        print(f"already warm ({_stamp_path()})")
        return

    checkpoint = models_dir() / "wav2vec2.safetensors"
    if not checkpoint.is_file():
        raise SystemExit(f"missing model file: {checkpoint}. Run: pixi run convert")

    model = build()
    for seconds in SECONDS:
        samples = seconds * SAMPLE_RATE
        print(f"compiling {seconds}s CPU graph ({samples} samples)", flush=True)
        compile_model(model, batch=1, num_samples=samples)
    path = _stamp_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(_signature())
    print(f"wrote {path}")


def main() -> None:
    p = argparse.ArgumentParser(description="Compile the CPU graphs nadakit uses")
    p.add_argument("--force", action="store_true", help="compile even if already warm")
    warm(force=p.parse_args().force)


if __name__ == "__main__":
    main()
