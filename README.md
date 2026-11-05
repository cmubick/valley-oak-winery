# Valley Oak Winery

Website for Valley Oak Winery: a public wine catalog plus an admin area for managing wines and photos.

**Live:** <https://valleyoakwinery.chrisubick.io>

## How it fits together

- **Next.js 15 app** (`src/app`). It serves the pages and the API routes (`src/app/api`).
- **DynamoDB** stores wines (`winery-wines`), admin users (`winery-users`) and settings such as the Instagram token (`winery-settings`).
- **S3** stores wine photos. The browser uploads them directly using a presigned URL from `/api/upload-url`.
- **NextAuth** handles admin login (email/password checked against `winery-users`).
- **Locally**, LocalStack (Docker) stands in for DynamoDB and S3.
- **In production**, AWS Amplify Hosting runs the app and talks to the real DynamoDB and S3 in `us-west-2`.

## Run locally

Requirements: Node 22 (`nvm use`) and Docker.

```bash
npm install
cp .env.example .env.local
npm run dev:local                                    # starts LocalStack, creates tables/bucket, seeds wines, runs next dev
npm run create-admin -- you@example.com 'password'   # first time only, in another terminal
```

- Site: <http://localhost:3000>
- Admin: <http://localhost:3000/admin/login>

`npm run localstack:stop` shuts LocalStack down. Data doesn't survive a LocalStack restart, so you'll need to re-run `create-admin` afterwards.

## Deploy

Pushing to `main` deploys. Amplify builds and releases automatically in about 3–5 minutes. Check progress in the AWS console under Amplify → valley-oak-winery.

### Infrastructure changes

Everything is defined in `terraform/main.tf`. Terraform state is local (`terraform/terraform.tfstate`, gitignored), so infra changes have to be run from this machine.

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars   # first time: fill in secrets
npm run tf:plan
npm run tf:apply
```

### Admin users in production

```bash
npm run create-admin -- you@example.com 'password' --prod   # uses your AWS CLI credentials
```

Once logged in, an admin can create other users via `POST /api/admin`.

### Instagram photos (Pictures page)

The Pictures page shows the latest 9 posts from the winery's Instagram (a Business account), fetched by the server at most once an hour. If Instagram can't be reached it shows fallback photos from `public/images`. The admin page shows whether the feed is connected.

The access token lives in the `winery-settings` DynamoDB table. Newer Meta apps (like ours, `vow-photos`) only offer "API setup with Unified login", which issues a system-user token that never expires and is read through the Facebook Graph API. Tokens from the older "Instagram login" setup expire after 60 days; the site renews those automatically (weekly EventBridge job in `terraform/main.tf`, plus whenever posts are fetched). `src/lib/instagram.ts` handles both.

**Connecting the account (one time, or again if the admin page says it's disconnected):**

1. In the Meta developer dashboard for `vow-photos`, go to **API setup with Unified login → 1. Configure your app**. Make sure a configuration is **Selected** and the redirect URL `https://valleyoakwinery.chrisubick.io/api/instagram/callback` is registered and chosen. (Register `https://valleyoakwinery.com/api/instagram/callback` too once the site moves; either works for connecting.)
2. Have **App settings → Basic** open in another tab for the App ID and App secret.
3. Copy the **Login URL**, open it, log in, and pick the winery's business portfolio and @valleyoakwinery.
4. You land on `…/api/instagram/callback?code=…`, which shows "not found". That's expected. Copy the full address.
5. Right away (the code expires within minutes), run `npm run instagram-connect -- --prod` and paste the address, then the App ID and App secret. The script exchanges the code, finds the account, test-reads the latest posts and saves the token. The secret is used only by the script and isn't stored.

### Wine list### Wine list

`scripts/wines-seed.json` holds the wine list from the original valleyoakwinery.com site. `npm run seed-wines` loads it into LocalStack (it runs automatically as part of `dev:local` and skips if wines already exist). `npm run seed-wines -- --prod` loads it into production. Add `--force` to write even when the table isn't empty. Seed wines have fixed ids, so this resets those wines to the seed values without creating duplicates.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev:local` | LocalStack + table setup + dev server |
| `npm run dev` | Dev server only (LocalStack must already be running) |
| `npm run create-admin -- <email> <pw> [--prod]` | Create or reset an admin user |
| `npm run seed-wines -- [--prod] [--force]` | Load the original site's wine list |
| `npm run instagram-connect -- [--prod]` | Connect the Pictures page to Instagram |
| `npm run build` / `npm start` | Production build / serve it locally |
| `npm run tf:plan` / `npm run tf:apply` | Preview / apply infrastructure changes |
