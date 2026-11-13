# Redeploying the staging apps

The staging workflows (`.github/workflows/deploy-*-staging.yml`) run on a push to `staging` that changes their app's folder, `packages/**`, `package.json` or `bun.lock`. An empty commit deploys nothing.

To redeploy the hotel, admin and landing apps together, change the line below and push to `staging`. To redeploy one app, use "Run workflow" on that workflow in GitHub Actions.

Last full redeploy: 2026-11-13
