# Local Development with Cloud Database

This project uses **local development with Lovable Cloud** - you code locally but connect to the cloud database.

## Quick Start

```bash
npm run dev
```

That's it! Your local app connects to the cloud Supabase database automatically.

## How It Works

- **Frontend**: Runs locally at `http://localhost:8080`
- **Database**: Cloud Supabase at `https://sukyrypnsoyvlxrezlgv.supabase.co`
- **Edge Functions**: Cloud functions (automatically available)
- **Authentication**: Cloud auth (works immediately)

## Environment Variables

Your `.env` file contains the cloud credentials:
```
VITE_SUPABASE_PROJECT_ID="sukyrypnsoyvlxrezlgv"
VITE_SUPABASE_URL="https://sukyrypnsoyvlxrezlgv.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="..."
```

These are committed to git and shared with your deployed version.

## Making Database Changes

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/sukyrypnsoyvlxrezlgv
2. Navigate to **Table Editor** or **SQL Editor**
3. Make your changes
4. Changes are live immediately!

### Option 2: Via Lovable UI
1. Go to your Lovable project
2. Click **Supabase** in the left sidebar
3. Click **Open Supabase Dashboard**
4. Make changes in the dashboard

### Option 3: SQL Migrations (Advanced)
If you want to track schema changes in git:

```bash
# 1. Link to your cloud project (one-time)
supabase link --project-ref sukyrypnsoyvlxrezlgv

# 2. Pull current schema
supabase db pull

# 3. Make changes via SQL editor or Supabase Dashboard

# 4. Generate a migration from the changes
supabase db diff -f my-changes

# 5. Push migration back to cloud
supabase db push
```

## Testing Edge Functions

Your Edge Functions run in the cloud. To test them:

```bash
# Test generate-content-plan
curl -X POST https://sukyrypnsoyvlxrezlgv.supabase.co/functions/v1/generate-content-plan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contentPlanId": "some-uuid"}'

# Or test via your local app
npm run dev
# Then use the UI to trigger the functions
```

## Viewing Database Data

**Supabase Studio (Cloud)**:
- Go to: https://supabase.com/dashboard/project/sukyrypnsoyvlxrezlgv
- View tables, run queries, manage users

**Or via Lovable**:
- Open your Lovable project
- Click **Supabase** → **Open Supabase Dashboard**

## Benefits of This Approach

✅ **Simple**: No Docker or local database setup required
✅ **Fast iteration**: Code locally, data in cloud
✅ **Always in sync**: Local dev and deployed app use same database
✅ **Automatic deployments**: Push to git = auto-deploy via Lovable
✅ **No migration hassle**: Schema changes are immediate
✅ **Team-friendly**: Everyone uses the same data

## Development Workflow

```bash
# 1. Start your dev server
npm run dev

# 2. Make code changes in your editor
# Changes hot-reload automatically

# 3. Make database changes in Supabase Dashboard
# Changes are live immediately

# 4. Commit your code changes
git add .
git commit -m "Add new feature"

# 5. Push to deploy (if using Lovable auto-deploy)
git push origin main
```

## Important Notes

- **Live data**: Your local development uses the same database as your deployed app
- **Be careful**: Database changes affect the live app immediately
- **Use test accounts**: Create test users/data for development
- **RLS policies**: Row Level Security protects user data even during development

## Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/sukyrypnsoyvlxrezlgv
- **Your App (Local)**: http://localhost:8080
- **Your App (Deployed)**: Check Lovable for deployment URL

## Troubleshooting

### "Auth error" or "Invalid JWT"
- Check that `.env` has the correct `VITE_SUPABASE_PUBLISHABLE_KEY`
- Make sure you're signed in to the app

### "Cannot connect to Supabase"
- Verify your internet connection
- Check that `VITE_SUPABASE_URL` is correct in `.env`

### "Edge function not found"
- Ensure the function is deployed in Supabase Dashboard
- Check function logs in Supabase Dashboard → Edge Functions

### Want to use local Supabase instead?
See the advanced setup guide (requires Docker and Supabase CLI).

---

**Questions?** Check the [Lovable docs](https://docs.lovable.dev/) or [Supabase docs](https://supabase.com/docs)!
