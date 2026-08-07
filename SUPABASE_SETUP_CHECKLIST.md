# 📋 Supabase Setup Checklist

## Step 1: Run SQL Fix
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run `COMPLETE_STABILITY_FIX.sql`
4. Verify success messages

## Step 2: Disable Email Confirmation
1. Go to Authentication > Providers
2. Click Email provider
3. Turn OFF "Confirm email"
4. Save changes

## Step 3: Verify Settings
- [ ] Email confirmation disabled
- [ ] RLS policies active
- [ ] Realtime enabled
- [ ] Storage bucket public
- [ ] Triggers working

## Step 4: Test
- [ ] Register new user
- [ ] Login immediately
- [ ] Post problem
- [ ] See realtime updates

✅ All done! App is now stable.
