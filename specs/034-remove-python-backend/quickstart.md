# Quickstart: OmniPost Environment Setup

This project uses a monorepo structure managed by npm workspaces. The Python legacy backend has been entirely removed, significantly simplifying the setup process.

## Prerequisites

1.  **Node.js**: v20 or higher.
2.  **npm**: v9.0.0 or higher.
3.  **Playwright dependencies**: Required for browser automation in the Node.js backend.

## Initialization

Run the following command in the root of the repository to install all workspace dependencies:

```bash
npm run setup
```

If this is your first time or if you updated playwright, initialize Playwright browsers:

```bash
npx playwright install chromium
```

## Running the Application

You can start the frontend and backend concurrently from the root directory:

```bash
# Start the Node.js Backend
npm run dev:node

# Start the Vue.js Frontend
npm run dev:frontend
```

## Testing

```bash
npm run test:node
```
