"""Compute the "typical audio" vector that `Engine.embed` subtracts.

Mean-pooled wav2vec 2.0 states of unrelated clips all share a large common
component, so raw cosines between any two sounds sit near 0.8. Subtracting the
mean over a spread of ordinary audio removes it and leaves the part that
differs from clip to clip. The audio here is deliberately not the sounds the
app is taught: macOS text-to-speech reading ordinary phrases in several
voices, plus tones and noise bursts.

    pixi run make-center
    python -m nadakit.make_center [MODELS_DIR [OUTPUT.npy]]

Needs `say`, so it only runs on macOS. The result is checked in as
`nadakit/embed_center.npy`, because it depends only on the model and the
pooling in `Engine`. Regenerate it if either changes.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

from .core import embed_center_path, models_dir, package_dir
from .engine import SAMPLE_RATE, Engine
from .features import read_wav

VOICES = ["Samantha", "Daniel", "Karen", "Moira", "Rishi", "Tessa"]
PHRASES = [
    "hello there", "thank you very much", "one two three four", "the weather is nice today",
    "good morning", "please open the door", "banana", "computer", "yellow", "remember",
    "wonderful", "listen carefully", "what time is it", "see you tomorrow",
]


def speak(voice: str, text: str, folder: Path) -> np.ndarray | None:
    path = folder / f"{voice}-{abs(hash(text))}.wav"
    done = subprocess.run(
        ["say", "-v", voice, "-r", "175", "-o", str(path), "--file-format=WAVE",
         "--data-format=LEI16@16000", text],
        capture_output=True,
    )
    return read_wav(path) if done.returncode == 0 and path.exists() else None


def synthetic() -> list[np.ndarray]:
    rng = np.random.default_rng(0)
    t = np.arange(SAMPLE_RATE) / SAMPLE_RATE
    clips = [(0.4 * np.sin(2 * np.pi * f * t)).astype(np.float32) for f in (220, 440, 880, 1760)]
    for i in range(6):
        n = 12_000
        clips.append((rng.standard_normal(n) * np.exp(-np.arange(n) / (1500 + 500 * i)) * 0.5).astype(np.float32))
    return clips


def main() -> None:
    models = Path(sys.argv[1]) if len(sys.argv) > 1 else models_dir()
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else package_dir() / "embed_center.npy"
    engine = Engine(models)
    clips = synthetic()
    with tempfile.TemporaryDirectory() as folder:
        for voice in VOICES:
            for phrase in PHRASES:
                wave = speak(voice, phrase, Path(folder))
                if wave is not None:
                    clips.append(wave)
    if len(clips) < 20:
        raise SystemExit(f"only {len(clips)} clips; is `say` working?")
    center = np.mean([engine.pooled(wave) for wave in clips], axis=0).astype(np.float32)
    output.parent.mkdir(parents=True, exist_ok=True)
    np.save(output, center)
    print(f"wrote {output} from {len(clips)} clips")


if __name__ == "__main__":
    main()
