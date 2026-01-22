# Auto-Approve Workflows Setup Guide

This guide explains how to configure automatic approval of GitHub Actions workflows for PRs from trusted sources (Copilot, Dependabot, etc.).

## 📋 Overview

By default, GitHub requires manual approval for workflows triggered by:
- Pull requests from forks
- Pull requests from first-time contributors
- **Pull requests from GitHub Copilot** (security policy enforced since 2024-2025)

The `auto-approve-workflows.yml` workflow attempts to automatically approve these workflow runs for trusted bot accounts, reducing manual overhead while maintaining security.

## 🔒 Security Considerations

**Important:** This workflow includes safety checks:
- ✅ Only approves PRs from explicitly trusted bot accounts
- ✅ **Skips approval** if any `.github/workflows/` files are modified
- ✅ Requires manual review for workflow changes

**Trusted accounts:**
- `copilot-autofix[bot]`
- `github-copilot[bot]`
- `dependabot[bot]`

To add more trusted accounts, edit the workflow's `if` condition.

## ⚙️ Configuration Options

### Option 1: Use Default GITHUB_TOKEN (Limited Functionality)

The workflow is configured by default to use `GITHUB_TOKEN`, but this token has **limited permissions** and **cannot approve workflow runs** in most scenarios.

**Result:** The workflow will run and attempt to approve, but will fail with permission errors. You'll see informative messages in the workflow logs.

**When to use:** For testing or if you want to enable the workflow later without immediate changes.

### Option 2: Configure GitHub App Token (Recommended)

A GitHub App provides fine-grained permissions and is the most secure option.

#### Steps:

1. **Create a GitHub App:**
   - Go to Settings → Developer settings → GitHub Apps → New GitHub App
   - **Name:** `Workflow Auto-Approver` (or your choice)
   - **Webhook:** Disable (uncheck "Active")
   - **Permissions:**
     - Repository permissions:
       - Actions: Read and write
       - Pull requests: Read-only
       - Contents: Read-only
   - **Where can this GitHub App be installed:** Only on this account
   - Click "Create GitHub App"

2. **Install the App:**
   - After creation, click "Install App"
   - Select your repository
   - Click "Install"

3. **Create a Private Key:**
   - In your app settings, scroll to "Private keys"
   - Click "Generate a private key"
   - Save the downloaded `.pem` file securely

4. **Get App ID:**
   - Note the App ID shown in the app settings (top of the page)

5. **Add Secrets to Repository:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add two secrets:
     - `APP_ID`: Your GitHub App ID
     - `APP_PRIVATE_KEY`: Contents of the `.pem` file

6. **Update the Workflow:**
   - Modify `.github/workflows/auto-approve-workflows.yml`
   - Replace the `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` lines with:
     ```yaml
     - name: Generate GitHub App Token
       id: generate-token
       uses: actions/create-github-app-token@v1
       with:
         app-id: ${{ secrets.APP_ID }}
         private-key: ${{ secrets.APP_PRIVATE_KEY }}
     
     # Then use in later steps:
     env:
       GH_TOKEN: ${{ steps.generate-token.outputs.token }}
     ```

### Option 3: Use Personal Access Token (PAT)

If you prefer not to create a GitHub App, you can use a PAT from a user with write access.

⚠️ **Warning:** PATs are tied to user accounts and have broader permissions. Use with caution.

#### Steps:

1. **Create a Fine-Grained PAT:**
   - Go to Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Click "Generate new token"
   - **Repository access:** Only select repositories → Choose your repo
   - **Permissions:**
     - Actions: Read and write
     - Pull requests: Read-only
     - Contents: Read-only
   - **Expiration:** Set to 1 year or less (must be rotated)
   - Click "Generate token" and copy the token

2. **Add Secret to Repository:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add secret:
     - Name: `WORKFLOW_APPROVER_TOKEN`
     - Value: Your PAT

3. **Update the Workflow:**
   - Modify `.github/workflows/auto-approve-workflows.yml`
   - Replace `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` with:
     ```yaml
     GH_TOKEN: ${{ secrets.WORKFLOW_APPROVER_TOKEN }}
     ```

## 🧪 Testing

After configuration, test the workflow:

1. Create a test PR from GitHub Copilot or manually trigger dependabot
2. Check the Actions tab for "Auto-Approve Workflows" run
3. Review the workflow logs to confirm approval succeeded
4. Verify that other workflows start running automatically

## 🔍 Troubleshooting

### Workflow runs but doesn't approve

**Symptom:** The workflow completes but other workflows still need approval.

**Solution:** 
- Check that you've configured a GitHub App token or PAT (Option 2 or 3)
- Verify the token has `actions: write` permission
- Review workflow logs for specific error messages

### Workflow doesn't trigger

**Symptom:** Auto-approve workflow doesn't run when PR is created.

**Solution:**
- Ensure the PR is from a trusted account (copilot, dependabot)
- Check that `pull_request_target` event is not blocked by branch protection
- Verify the workflow file syntax is valid

### Security warning about workflow file changes

**Symptom:** Workflow skips approval with message about workflow files.

**Solution:** 
- This is expected behavior for security
- Manually review the workflow changes
- Manually approve the workflow runs

## 📚 Additional Resources

- [GitHub Docs: Approving workflow runs from forks](https://docs.github.com/en/actions/managing-workflow-runs/approving-workflow-runs-from-public-forks)
- [GitHub Apps Documentation](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps)
- [GitHub Copilot PR Review](https://docs.github.com/en/copilot/using-github-copilot/code-review/using-copilot-code-review)

## 🔄 Alternative: Adjust Repository Settings

If you want to reduce approval requirements for ALL contributors (not just bots):

1. Go to Settings → Actions → General
2. Under "Fork pull request workflows from outside collaborators"
3. Select "Require approval for first-time contributors who are new to GitHub"
   - This reduces approvals but doesn't exempt Copilot PRs

⚠️ **Note:** This setting does NOT bypass Copilot workflow approval requirements. The custom workflow is still needed for Copilot PRs.

## 💡 Best Practices

1. **Regularly review approved runs** - Check the Actions tab periodically
2. **Keep trusted accounts list minimal** - Only add accounts you fully trust
3. **Monitor for unusual activity** - Set up notifications for workflow failures
4. **Rotate tokens** - If using PAT, rotate before expiration
5. **Test in a fork first** - Validate configuration before deploying to main repo

---

**Last Updated:** 2026-01-22  
**Maintainer:** Project Contributors
