-- Add notification-related columns to user_preferences if not present
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS browser_notifications boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_frequency text DEFAULT 'instant',
ADD COLUMN IF NOT EXISTS dashboard_config jsonb DEFAULT '{}';

-- Add index for performance if not exists
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);