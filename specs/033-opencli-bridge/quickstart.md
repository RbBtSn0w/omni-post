# Quickstart: OmniPost OpenCLI Bridge

## 1. Register a Local Extension
Create a new folder in `apps/backend-node/extensions/my_platform/`.

### Create `manifest.ocs.json`:
```json
{
  "ocs_version": "1.0",
  "name": "My Custom Platform",
  "version": "1.0.0",
  "actions": {
    "publish_article": {
      "command": "publish",
      "args": {
        "file": "--file",
        "title": "--title"
      },
      "progress_regex": "Progress: (\\d+)%"
    }
  }
}
```

## 2. Sync Capabilities
1. Open OmniPost UI.
2. Go to **Extension Center**.
3. Click **Reload & Sync**.
4. "My Custom Platform (Local)" will appear in the publish list.

## 3. Command Line Interface (CLI Format)
Your internal script (`cli.js`) will receive parameters like:
`node cli.js publish --file /data/post.md --title "Hello World"`

The script should output `Progress: N%` to stdout to update the OmniPost frontend.
