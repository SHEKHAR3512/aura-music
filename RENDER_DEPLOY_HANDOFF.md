# Aura Music: Render deployment handoff

## Objective

Deploy the music backend from GitHub to a public HTTPS URL on Render, verify it, then build a new Android APK that uses that URL. The current APK falls back to `http://10.0.2.2:3000`, which works only for the Android emulator and cannot reach a server from a physical phone.

## Deployment source

- GitHub repository: https://github.com/SHEKHAR3512/aura-music
- Tested deployment branch: `deploy/render-music-api`
- Tested backend configuration commit: `ee2f615fb3c5a9b6de55b15285949e7ae0cfe64f` (the handoff file was added in a later commit)
- Render Blueprint: `render.yaml` at the root of **that branch**
- This branch contains the current backend API and its small shared catalog. It was created separately from the working `migration/react-native-cli` branch so unrelated local mobile migration changes and deletions were not pushed.

The deployment branch is already pushed to GitHub. Do not deploy `master`: it does not contain the newer `/api/v1` mobile endpoints required by this APK.

## Render service configuration

The Blueprint specifies:

| Setting | Value |
| --- | --- |
| Service type | Web service |
| Runtime | Node |
| Plan | Free |
| Region | Singapore |
| Build command | `npm ci --workspaces=false --include=dev && npm run build` |
| Start command | `npm start` |
| Health check | `/api/v1/health` |
| Environment variable | `NODE_ENV=production` |

No secret is needed for the health and licensed music catalog endpoints. Firebase authentication and email OTP require their own configuration later. Do not put secrets in Git or in this file.

## What was verified before handoff

In a clean checkout of the deployment branch, `npm ci --workspaces=false --include=dev` and `npm run build` succeeded. The production server was started locally and returned:

- `GET /api/v1/health` → JSON with `"status":"ok"`, `"catalog":2`, and `"version":1`
- `GET /api/v1/music/home` → JSON with 2 catalog tracks

These checks verify the packaged server locally. They do **not** prove that a Render service is running yet.

## Work for Gemini

1. Connect the user's Render account in the environment where you will deploy. Use the account's normal authorization flow; never request a password or paste an API key into this file.
2. In Render, create a Blueprint from the GitHub repository and select branch `deploy/render-music-api`. If branch selection is unavailable in the Blueprint flow, create a Node Web Service from the same branch using the settings above. Review any existing `aura-music` service before creating a duplicate.
3. Wait for the build, deploy, and Render health check to pass. Record the **actual** public `https://...onrender.com` URL shown by Render; do not infer it from the service name.
4. Verify the live endpoints from outside the service:
   - `<public-url>/api/v1/health` returns JSON with `status: ok`.
   - `<public-url>/api/v1/music/home` returns the catalog.
   - If practical, verify a `wss://` connection to `/ws/jam` for Jam sessions.
5. Report the public URL and any failed checks. If the deployment fails, inspect Render build/runtime logs and fix the deployment branch, then redeploy.

## Android follow-up after the URL is live

The existing APK was built before the hosted URL existed. On the Windows checkout, set the exact Render URL and build a **new** APK:

```powershell
$env:AURA_API_BASE_URL = 'https://<actual-render-url>'
npm run android:apk
```

The app's `apps/mobile-native/babel.config.js` embeds `AURA_API_BASE_URL` during the build. `apps/mobile-native/src/api/client.ts` derives the secure WebSocket URL from it. Verify the new APK's signature and install that new file from `dist/aura-mobile-release.apk` on the device. This mobile code currently exists only in the local `migration/react-native-cli` worktree; it is **not** part of the backend deployment branch. The release script uses a device-testing signing key unless private `AURA_ANDROID_*` signing variables are configured.

## Free-plan behavior

Render Free services sleep after 15 minutes without inbound traffic and can take about a minute to wake. The first app request after idle may time out and need a retry. In-memory Jam rooms and email codes are lost on sleep or restart. Render Free blocks outbound SMTP on port 587, so email OTP needs an HTTPS email provider or a different host. The backend also calls external music providers for some features; verify those routes separately from the two-track licensed catalog.

## Status at handoff

GitHub branch pushed and locally verified. No live Render URL or completed Render deployment has been confirmed in this conversation. The Render integration was still reported as uninstalled in this chat at the last check, even though the user attempted to connect it.
