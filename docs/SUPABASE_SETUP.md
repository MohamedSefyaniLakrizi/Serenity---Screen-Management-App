# Supabase Setup for Serenity Onboarding

## Database Schema

You need to create an `onboarding` table in your Supabase database with the following schema:

### SQL to Create Table

```sql
-- Create onboarding table
CREATE TABLE onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  
  -- User Info
  name TEXT,
  email TEXT,
  
  -- Goals & Preferences
  primary_goal TEXT CHECK (primary_goal IN ('reduce-usage', 'build-focus', 'better-sleep', 'life-balance')),
  daily_limit_hours INTEGER,
  daily_limit_minutes INTEGER,
  
  -- Fox Companion
  fox_name TEXT,
  
  -- Permissions
  notifications_enabled BOOLEAN DEFAULT FALSE,
  screen_time_permission_granted BOOLEAN DEFAULT FALSE,
  
  -- Usage Analytics
  current_daily_usage_hours INTEGER,
  problem_apps TEXT[] DEFAULT '{}',
  when_use_phone_most TEXT CHECK (when_use_phone_most IN ('morning', 'afternoon', 'evening', 'night', 'all-day')),
  reason_for_change TEXT,
  
  -- Analytics
  analytics_enabled BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE,
  device_platform TEXT,
  device_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_onboarding_user_id ON onboarding(user_id);
CREATE INDEX idx_onboarding_completed_at ON onboarding(completed_at);
CREATE INDEX idx_onboarding_created_at ON onboarding(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow insert for authenticated and anonymous users
CREATE POLICY "Allow insert for all users"
  ON onboarding
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow select for authenticated users (their own data)
CREATE POLICY "Users can view own data"
  ON onboarding
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous users to insert without user_id
CREATE POLICY "Allow anonymous insert"
  ON onboarding
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
```

## Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://wdwmnzdlprrixfjeyxio.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key_here
```

## Testing the Setup

1. **Create the table** in Supabase SQL Editor
2. **Run the app** and complete onboarding
3. **Check the data** in Supabase Table Editor
4. Verify data appears in the `onboarding` table

## Data Flow

1. User completes all 10 onboarding steps
2. Data is collected in Zustand store
3. On step 10, data is sent to Supabase
4. Data is also saved locally in AsyncStorage
5. `onboardingCompleted` flag is set to prevent showing onboarding again

## Notes

- The app works without Supabase (data stored locally)
- If Supabase save fails, user can still proceed
- All onboarding data is optional except primary goal and fox name
- Privacy: User can opt out of analytics

## Optional Enhancements

### Add User Authentication
If you want to link onboarding data to user accounts:

```sql
-- Update the user_id column to link to authenticated users
UPDATE onboarding 
SET user_id = auth.uid() 
WHERE id = 'onboarding_id';
```

### Add Analytics Queries

```sql
-- Most common goals
SELECT primary_goal, COUNT(*) as count
FROM onboarding
WHERE completed_at IS NOT NULL
GROUP BY primary_goal
ORDER BY count DESC;

-- Average daily limit
SELECT 
  AVG(daily_limit_hours) as avg_hours,
  AVG(daily_limit_minutes) as avg_minutes
FROM onboarding
WHERE completed_at IS NOT NULL;

-- Analytics opt-in rate
SELECT 
  COUNT(*) FILTER (WHERE analytics_enabled = true) * 100.0 / COUNT(*) as opt_in_percentage
FROM onboarding
WHERE completed_at IS NOT NULL;
```

## Troubleshooting

### "Missing Supabase environment variables" error
- Check your `.env` file exists in the project root
- Restart the Expo dev server after adding environment variables

### Data not appearing in Supabase
- Check RLS policies are correctly configured
- Verify your anon key has insert permissions
- Check the browser/app console for errors

### Onboarding showing again after completion
- Clear AsyncStorage: `AsyncStorage.clear()`
- Check `onboardingCompleted` key in storage
- Verify the completion flow in step10.tsx

## Next Steps

After setup:
1. Test the full onboarding flow
2. Verify data in Supabase
3. Customize questions/screens as needed
4. Add user authentication (optional)
5. Build analytics dashboard (optional)
