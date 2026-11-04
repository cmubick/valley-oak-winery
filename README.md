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

The Pictures page shows the latest 9 posts from the winery's Instagram, fetched by the server at most once an hour. It uses Meta's "Instagram API with Instagram Login", which requires the Instagram account to be a Business or Creator account. The access token lives in the `winery-settings` DynamoDB table. Tokens expire after 60 days, so the site renews them: weekly via an EventBridge job (`terraform/main.tf`) and whenever posts are fetched. If Instagram can't be reached, the page shows fallback photos from `public/images`. The admin page shows whether the feed is connected and when the token expires.

**Connecting the account (one time):**

1. At <https://developers.facebook.com/apps>, create an app and pick the use case for managing content on Instagram (the one that offers "API setup with Instagram login").
2. In the app, open **Instagram → API setup with Instagram login → Generate access tokens**, add the winery's Instagram account and log in as it. If asked, accept the tester invite in Instagram first. Then generate a token. The app can stay in Development mode: it only reads the winery's own account, so no App Review is needed.
3. Run `npm run instagram-token -- --prod` and paste the token when prompted. It checks the token with Instagram and saves it.

Re-run step 3 only if the admin page reports the feed is disconnected (e.g. the Instagram password changed or the app was removed).

### Wine list

`scripts/wines-seed.json` holds the wine list from the original valleyoakwinery.com site. `npm run seed-wines` loads it into LocalStack (it runs automatically as part of `dev:local` and skips if wines already exist). `npm run seed-wines -- --prod` loads it into production. Add `--force` to write even when the table isn't empty. Seed wines have fixed ids, so this resets those wines to the seed values without creating duplicates.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev:local` | LocalStack + table setup + dev server |
| `npm run dev` | Dev server only (LocalStack must already be running) |
| `npm run create-admin -- <email> <pw> [--prod]` | Create or reset an admin user |
| `npm run seed-wines -- [--prod] [--force]` | Load the original site's wine list |
| `npm run instagram-token -- [--prod]` | Connect the Pictures page to Instagram |
| `npm run build` / `npm start` | Production build / serve it locally |
| `npm run tf:plan` / `npm run tf:apply` | Preview / apply infrastructure changes |
