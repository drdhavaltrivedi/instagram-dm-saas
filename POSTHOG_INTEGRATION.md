# PostHog Analytics Integration

PostHog has been successfully integrated into the DMflow application for comprehensive analytics tracking.

## ✅ What's Been Integrated

### 1. Core Setup
- ✅ PostHog provider component (`src/lib/posthog.ts`)
- ✅ PostHog hook for easy tracking (`src/hooks/use-posthog.ts`)
- ✅ Root layout integration
- ✅ Automatic pageview tracking

### 2. Event Tracking

#### Authentication Events
- `user_signed_up` - When a new user signs up
- `user_logged_in` - When a user logs in
- `login_failed` - When login fails
- `signup_failed` - When signup fails

#### Campaign Events
- `campaign_created` - When a campaign is created
  - Properties: `campaign_id`, `total_recipients`, `contacts_count`, `leads_count`, `has_description`
- `campaign_status_updated` - When campaign status changes
  - Properties: `campaign_id`, `old_status`, `new_status`, `total_recipients`
- `campaign_creation_failed` - When campaign creation fails

#### Instagram Account Events
- `instagram_account_connected` - When an Instagram account is connected
  - Properties: `method` (cookie/extension), `username`, `is_new_account`

#### Lead Generation Events
- `lead_search_performed` - When a lead search is executed
  - Properties: `search_type` (username/hashtag/followers), `query`, `results_count`, `has_preset`, `has_custom_keywords`

#### Automation Events
- `automation_created` - When an automation is created
  - Properties: `automation_id`, `trigger_type`, `has_description`
- `automation_status_toggled` - When automation is enabled/disabled
  - Properties: `automation_id`, `new_status`
- `automation_creation_failed` - When automation creation fails

## 🔧 Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_24Q6SdPJCXZNP7GfojwBdEIVIEZOmqgrgjOR8014afI
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### For Production (Netlify)

Add these environment variables in your Netlify dashboard:
1. Go to Site Settings → Environment Variables
2. Add `NEXT_PUBLIC_POSTHOG_KEY`
3. Add `NEXT_PUBLIC_POSTHOG_HOST`

## 📊 Usage

### Automatic Tracking
- **Pageviews**: Automatically tracked on all pages
- **User Identification**: Automatically identifies users on login/signup

### Manual Tracking

Use the `usePostHog` hook in any component:

```tsx
import { usePostHog } from '@/hooks/use-posthog';

function MyComponent() {
  const { capture, identify } = usePostHog();

  const handleAction = () => {
    capture('button_clicked', {
      button_name: 'submit',
      page: 'settings',
    });
  };

  // Identify user
  useEffect(() => {
    if (user) {
      identify(user.id, {
        email: user.email,
        name: user.name,
      });
    }
  }, [user]);

  return <button onClick={handleAction}>Click me</button>;
}
```

## 🎯 Tracked Pages

All dashboard pages automatically track pageviews:
- `/inbox` - Inbox page
- `/campaigns` - Campaigns page
- `/leads` - Leads page
- `/ai-studio` - AI Studio page
- `/settings/*` - All settings pages
- `/analytics` - Analytics page

## 📈 PostHog Dashboard

After deployment, you can view analytics in your PostHog dashboard:
1. Go to https://us.i.posthog.com
2. Navigate to your project
3. View events, funnels, and user insights

## 🔍 Key Metrics to Monitor

1. **User Acquisition**
   - Signups per day
   - Signup conversion rate
   - Login success rate

2. **Feature Usage**
   - Campaigns created
   - Instagram accounts connected
   - Lead searches performed
   - Automations created

3. **User Engagement**
   - Daily active users
   - Pages per session
   - Feature adoption rates

4. **Error Tracking**
   - Failed logins
   - Campaign creation failures
   - Automation creation failures

## 🚀 Next Steps

1. **Add Environment Variables**
   - Update `.env.local` with your PostHog keys
   - Add to Netlify environment variables for production

2. **Verify Installation**
   - Visit your app
   - Check PostHog dashboard for events
   - Verify pageviews are being tracked

3. **Custom Events** (Optional)
   - Add more custom events as needed
   - Create funnels for key user flows
   - Set up alerts for important events

## 📝 Notes

- PostHog only initializes on the client side
- Events are automatically batched for performance
- User identification happens on login/signup
- All tracking respects user privacy (no PII unless explicitly added)

## 🔗 Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog Next.js Guide](https://posthog.com/docs/libraries/next-js)
- [Event Tracking Best Practices](https://posthog.com/docs/getting-started/send-events)

