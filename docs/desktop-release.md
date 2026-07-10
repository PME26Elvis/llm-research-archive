# Desktop Release

The Electron desktop application source remains on the `app-main` branch. The default `main` branch contains only a thin GitHub Actions dispatcher for manual releases.

To create a desktop release draft:

1. Open the repository on GitHub.
2. Go to **Actions**.
3. Select **Desktop Release**.
4. Choose **Run workflow**.
5. Use these values for the first run:
   - `target_ref`: `app-main`
   - `requested_version`: leave blank
   - `channel`: `prerelease`
   - `publish`: `false`

When `requested_version` is blank, the reusable workflow reads the version from `package.json` on the selected `target_ref`. With `publish=false`, the workflow builds and verifies the Windows and Linux packages, uploads the exact release asset set, and leaves the GitHub Release as a draft.

Use `publish=true` only after a successful draft run has been reviewed. The reusable implementation is maintained at `.github/workflows/desktop-release-reusable.yml` on `app-main`.
