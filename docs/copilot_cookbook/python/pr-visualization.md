# Generating PR Age Charts

Build an interactive CLI tool that visualizes pull request age distribution for a GitHub repository using Copilot's built-in capabilities.

> **Runnable example:** [recipe/pr_visualization.py](recipe/pr_visualization.py)
>
> ```bash
> cd recipe && pip install -r requirements.txt
> # Auto-detect from current git repo
> python pr_visualization.py
>
> # Specify a repo explicitly
> python pr_visualization.py --repo github/copilot-sdk
> ```

## Example scenario

You want to understand how long PRs have been open in a repository. This tool detects the current Git repo or accepts a repo as input, then lets Copilot fetch PR data via the GitHub MCP Server and generate a chart image.

## Prerequisites

```bash
pip install copilot-sdk
```

## Usage

```bash
# Auto-detect from current git repo
python pr_breakdown.py

# Specify a repo explicitly
python pr_breakdown.py --repo github/copilot-sdk
```

## Full example: pr_breakdown.py

(See upstream cookbook for full example usage and code.)

## How it works

1. **Repository detection**: Checks `--repo` flag → git remote → prompts user
2. **No custom tools**: Relies entirely on Copilot CLI's built-in capabilities:
   - **GitHub MCP Server** - Fetches PR data from GitHub
   - **File tools** - Saves generated chart images
   - **Code execution** - Generates charts using Python/matplotlib or other methods
3. **Interactive session**: After initial analysis, user can ask for adjustments

## Why this approach?

| Aspect          | Custom Tools      | Built-in Copilot                  |
| --------------- | ----------------- | --------------------------------- |
| Code complexity | High              | **Minimal**                       |
| Maintenance     | You maintain      | **Copilot maintains**             |
| Flexibility     | Fixed logic       | **AI decides best approach**      |
| Chart types     | What you coded    | **Any type Copilot can generate** |
| Data grouping   | Hardcoded buckets | **Intelligent grouping**          |
