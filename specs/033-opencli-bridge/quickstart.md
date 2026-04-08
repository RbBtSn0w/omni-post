# Quickstart: OmniPost OpenCLI Bridge

## 1. Register a Local Extension
Create a new folder in `apps/backend-node/extensions/my_platform/`.

### Create `manifest.ocs.json`:
```json
{
  "ocs_version": "1.0",
  "name": "My Custom Platform",
  "version": "1.0.0",
  "platform_id": 101,
  "actions": {
    "publish_article": {
      "command": "publish",
      "args": {
        "title": "--title",
        "content": "--content"
      },
      "progress_regex": "Progress: (\\d+)%"
    }
  }
}
```
*Note: `platform_id` is recommended for local extensions (100+) to ensure ID stability across syncs.*

## 2. Sync Capabilities
1. Open OmniPost UI.
2. Go to **Extension Center**.
3. Click **Sync Capabilities**.
4. "My Custom Platform" will appear in the publish list (identified with a **Local** tag).

## 3. Command Line Interface (CLI Format)
Your internal script (`cli.js`) will receive parameters like:
`node cli.js publish --title "Hello World" --content "Full article content..."`

The script should output `Progress: N%` to stdout to update the OmniPost frontend.
