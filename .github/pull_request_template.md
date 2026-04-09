## 🎯 PR Submission Checklist

Thank you for your contribution! Please ensure that your PR meets the following requirements.

### 📝 Description

<!-- Briefly describe your changes -->

### 🔧 Change Type

Please delete options that are not applicable:

- [ ] 🐛 Bug fix (fixes an existing bug)
- [ ] ✨ New feature (adds a new feature)
- [ ] 📚 Documentation update (only updates documentation)
- [ ] ♻️ Code refactoring (code improvements without changing functionality)
- [ ] 🧪 Test (adds or improves tests)
- [ ] 🔄 Dependency upgrade (upgrades dependency packages)
- [ ] 🚀 Performance optimization (performance improvements)

### ✅ Submission Checklist

Before submitting the PR, please ensure:

#### General Checks
- [ ] PR title is clear and concise, formatted as `[Type] Short description`, e.g., `[feat] Add user authentication`
- [ ] Code follows project coding standards
- [ ] No `console.log`, `print`, or other debugging statements
- [ ] No hardcoded keys or sensitive information

#### Backend Checks (if `apps/backend-node/` was modified)
- [ ] Code passes ESLint checks: `npm run lint:node`
- [ ] Related unit tests run: `npm run test:node`
- [ ] New features have corresponding test cases
- [ ] Test coverage has not decreased

#### Frontend Checks (if `apps/frontend/` was modified)
- [ ] Code passes ESLint checks: `npm run lint`
- [ ] Related unit tests run: `npm run test:frontend`
- [ ] Vue components follow Vue 3 Composition API best practices
- [ ] No TypeScript errors (if using TypeScript)
- [ ] Tested across multiple browsers (if applicable)

#### Testing Checks
- [ ] Unit tests added
- [ ] Integration tests added (if applicable)
- [ ] All existing tests still pass
- [ ] Local `npm test` passes completely

#### Documentation Checks
- [ ] Updated relevant READMEs or other documentation
- [ ] Added code comments (especially for complex logic)
- [ ] Updated CHANGELOG (if applicable)

### 🔗 Related Issues

Closes # (issue number)

### 📸 Screenshots or Videos (if applicable)

<!-- For UI changes, please add screenshots or videos -->

### 🚀 Deployment Instructions (if needed)

<!-- Is a migration required? Are new environment variables needed? etc. -->

---

## 📋 Reviewer Checklist

- [ ] Code logic is correct
- [ ] No obvious security vulnerabilities
- [ ] Performance is acceptable
- [ ] Testing is sufficient
- [ ] Documentation is complete
