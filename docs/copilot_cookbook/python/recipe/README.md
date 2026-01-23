# Runnable Recipe Examples

This folder contains standalone, executable Python examples for each cookbook recipe. Each file can be run directly as a Python script.

## Prerequisites

- Python 3.8 or later
- Install dependencies (this installs the local SDK in editable mode):

```bash
pip install -r requirements.txt
```

## Running Examples

Each `.py` file is a complete, runnable program with executable permissions:

```bash
python <filename>.py
# or on Unix-like systems:
./<filename>.py
```

### Available Recipes

| Recipe               | Command                          | Description                                |
| -------------------- | -------------------------------- | ------------------------------------------ |
| Error Handling       | `python error_handling.py`       | Demonstrates error handling patterns       |
| Multiple Sessions    | `python multiple_sessions.py`    | Manages multiple independent conversations |
| Managing Local Files | `python managing_local_files.py` | Organizes files using AI grouping          |
| PR Visualization     | `python pr_visualization.py`     | Generates PR age charts                    |
| Persisting Sessions  | `python persisting_sessions.py`  | Save and resume sessions across restarts   |

## Local SDK Development

The `requirements.txt` installs the local Copilot SDK using `-e ../..` (editable install). This means:

- Changes to the SDK source are immediately available
- No need to publish or install from PyPI
- Perfect for testing and development

If you modify the SDK source, Python will automatically use the updated code (no rebuild needed).