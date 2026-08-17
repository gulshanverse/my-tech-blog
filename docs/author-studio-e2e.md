# Author Studio E2E verification

The browser suite uses Playwright against a local production build by default. It uses the system Chromium binary and does not require a browser download.

## Run locally

```bash
npm run build
npm run test:e2e
```

Set `E2E_BASE_URL` to verify another already-deployed environment. The public route and logged-out protection tests always run. Authenticated dashboard, editor, recovery, and Share Studio tests run only when both `E2E_AUTHOR_USERNAME` and `E2E_AUTHOR_PASSWORD` are supplied through the environment.

```bash
E2E_BASE_URL=https://staging.example.com \
E2E_AUTHOR_USERNAME=staging-author \
E2E_AUTHOR_PASSWORD='provided-out-of-band' \
npm run test:e2e
```

Do not place credentials in source control, `.env` files committed to the repository, test snapshots, or CI logs. Use a disposable staging environment and a disposable article if mutation coverage is enabled in the future. The current suite intentionally does not create, publish, restore, delete, or upload repository content; it verifies the authenticated read/editor/share surfaces without destructive GitHub operations.

For a focused run, use Playwright’s normal filter options, for example `npm run test:e2e -- -g "Share Studio"`.
