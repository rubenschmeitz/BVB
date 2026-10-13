# BVB in Codex Cloud

This checkout contains the website files and portable development commands.
Python 3.12 and Node.js 22 are the recommended runtimes.

```bash
bash scripts/setup.sh
# If Chromium reports missing Linux libraries:
npx playwright install-deps chromium
npm run check
npm test
npm run dev -- --port 8080
```

Preview binds to loopback. For a Cloud port preview use `HOST=0.0.0.0 npm run dev`
(static previews) inside the authenticated development environment.
The shared prototype backend remains bound to loopback.
Browser tests save reports/screenshots to `.artifacts/`, use synthetic data and
replace external service responses. They do not send real messages or enquiries.

## Environment setup

In Codex choose **Work in > Cloud > Select environment > Create environment**
and select `rubenschmeitz/BVB`. Ask setup to run
`bash scripts/setup.sh`, then `npm run check` and `npm test`. Review the setup
report and select **Publish**. New cloud tasks must start from the prepared Git
branch containing these files.

For the print website, include the separate BONSAI3D and private YORI3D repositories
and the private `print-website-workspace` repository in one environment.
The current standalone websites are authoritative for their respective designs.
The shared prototype is older; do not regenerate or overwrite BONSAI3D from it.

Permit package downloads during installation (PyPI, npm and Playwright browser
download hosts). No service credentials are needed for development. GitHub
repository authorization is through your own Codex account connection.

## Saving and continuing

Commit/push work to a development branch before switching to another task.
Reopen the same cloud task to continue uncommitted work; another task gets its
own workspace. Saved VM state has a limited recovery window and is not a backup.
Keep durable code and website assets in GitHub. Pull reviewed changes locally
only when the local working tree is ready; preserve ongoing work.

Publishing a Cloud environment does not deploy a change to the public website.
Local private archives, unfinished edits, original manufacturing models, physical
printers and the PC-installed Agent-Slicer are not copied into this environment.
The static websites are editable using their existing checked-in images.

References:
- https://developers.openai.com/codex/environments/cloud-environments
- https://help.openai.com/en/articles/20001545-using-codex-cloud
