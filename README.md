# JASCO: Joint Audio And Symbolic Conditioning for Temporally Controlled Text-To-Music Generation

AudioCraft provides the code and models for JASCO, a temporally controlled text-to-music generation model utilizing both symbolic and audio-based conditions. JASCO can generate high-quality music samples conditioned on global text descriptions along with fine-grained local controls.

## Installation

First, please follow the AudioCraft installation instructions. Then, download and install `chord_extractor` from [source](http://www.isophonics.net/nnls-chroma).

## Usage

You can interact with JASCO in two ways:
1. Use the gradio demo locally by running `python -m demos.jasco_app`, adding `--share` to deploy a sharable space.
2. Run the Jupyter notebook at `demos/jasco_demo.ipynb` locally.

## API

We provide a simple API and pre-trained models:
- `facebook/jasco-chords-drums-400M`: 400M model, text to music with chords and drums support.
- `facebook/jasco-chords-drums-1B`: 1B model, text to music with chords and drums support.
- `facebook/jasco-chords-drums-melody-400M`: 400M model, text to music with chords, drums, and melody support.
- `facebook/jasco-chords-drums-melody-1B`: 1B model, text to music with chords, drums, and melody support.

## Data Preprocessing

To use the JascoDataset with chords/melody conditioning, follow the instructions provided in the documentation.

## Training

The JascoSolver implements JASCO's training pipeline. Note that we do NOT provide any of the datasets used for training JASCO.

## Citation

```
@misc{tal2024joint,
    title={Joint Audio and Symbolic Conditioning for Temporally Controlled Text-to-Music Generation}, 
    author={Or Tal and Alon Ziv and Itai Gat and Felix Kreuk and Yossi Adi},
    year={2024},
    eprint={2406.10970},
    archivePrefix={arXiv},
    primaryClass={cs.SD}
}
```

## License

See license information in the model card.
