# Contributing to OmniPost

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to `OmniPost`, which is hosted on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
- [Styleguides](#styleguides)
  - [Git Commit Messages](#git-commit-messages)
  - [Python Styleguide](#python-styleguide)
  - [Vue.js Styleguide](#vuejs-styleguide)

## I Have a Question

Before you ask a question, it is best to search for existing [Issues](https://github.com/RbBtSn0w/omni-post/issues) that might help you. In case you have found a suitable issue and still need clarification, you can write your question in this issue.

## I Want To Contribute

### Reporting Bugs

This section guides you through submitting a bug report for `OmniPost`. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the steps to reproduce the problem** in as much detail as possible.
- **Provide specific examples** to demonstrate the steps.
- **Describe the behavior you observed after following the steps** and point out what problem is with that behavior.
- **Explain which behavior you expected to see instead and why.**

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for `OmniPost`, including completely new features and minor improvements to existing functionality.

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as much detail as possible.
- **Explain why this enhancement would be useful** to most `OmniPost` users.

### Your First Code Contribution

#### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RbBtSn0w/omni-post.git
   cd omni-post
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Install Playwright browser**
   ```bash
   cd apps/backend
   .venv/bin/python -m playwright install chromium
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### Python Styleguide

- We follow [PEP 8](https://www.python.org/dev/peps/pep-0008/).
- Use `flake8` to lint your code before submitting.
- Use `black` for code formatting (line length: 100).
- Use type hints for function signatures.

**Naming conventions:**
- Classes: `PascalCase` (e.g., `DouYinVideo`)
- Functions/Variables: `snake_case` (e.g., `process_video`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_UPLOAD_SIZE`)
- Private methods: prefix with `_` (e.g., `_internal_method`)

**Good practices:**
```python
# Use type hints
from pathlib import Path
from typing import Optional

async def process_video(
    file_path: str,
    platform: str,
    metadata: Optional[dict] = None
) -> bool:
    """Process and upload video to specified platform."""
    if not Path(file_path).exists():
        raise FileNotFoundError(f"Video file not found: {file_path}")
    return True

# Use async/await for I/O operations
async def login_platform(account_file: Path) -> bool:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        # ... implementation
        await browser.close()
        return True
```

**Testing:**
- Write unit tests for new functions
- Aim for at least 80% code coverage
- Use `pytest` for test framework
- Mock external dependencies

### Vue.js Styleguide

- We follow the [Vue.js Style Guide](https://vuejs.org/style-guide/).
- Use `eslint` to lint your code.
- Use Composition API for new components
- Use absolute imports with `@/` alias

**Good practices:**
```vue
<template>
  <div class="video-publisher">
    <el-form @submit.prevent="handlePublish">
      <el-form-item label="Platform">
        <el-select v-model="form.platform">
          <el-option label="Douyin" value="1" />
          <el-option label="Xiaohongshu" value="2" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="handlePublish">Publish</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { publishVideo } from '@/api/publish'

const form = reactive({
  platform: '',
  title: ''
})

const loading = ref(false)

const handlePublish = async () => {
  loading.value = true
  try {
    await publishVideo(form)
    ElMessage.success('Published successfully')
  } catch (error) {
    ElMessage.error('Publish failed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.video-publisher {
  max-width: 600px;
  margin: 0 auto;
}
</style>
```

**Key principles:**
- Use descriptive variable names
- Keep components focused and single-responsibility
- Handle loading and error states explicitly
