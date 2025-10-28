# Discord Bot Role Sync Setup Guide

## Overview
The Discord bot automatically assigns roles based on user data from ProofStack:
- **Skill Level**: Unverified → Junior → Mid → Senior → Lead
- **User Type**: Talent (Professional) or Employer badges
- **Employer Subscription**: Free → Basic → Professional → Enterprise
- **Talent Boosts**: Standard → Premium → Featured

## Setup Steps

### 1. Get Your Discord Server ID
1. Enable Developer Mode in Discord: User Settings → Advanced → Developer Mode
2. Right-click your server name → Copy Server ID
3. Add to `.env.local`:
   ```bash
   DISCORD_GUILD_ID=YOUR_SERVER_ID_HERE
   ```

### 2. Invite the Bot to Your Server
The bot should already be in your server with permissions `3625221425168`, which includes:
- Manage Roles
- View Channels
- Send Messages

If not, use this invite link (replace CLIENT_ID):
```
https://discord.com/oauth2/authorize?client_id=1432446077486891069&permissions=3625221425168&scope=bot
```

### 3. Test Role Sync

#### Manual Test via API
```bash
# Get your Discord user ID: Right-click your name in Discord → Copy User ID
# Get your guild ID from step 1

curl -X POST http://localhost:3000/api/discord/sync-roles \
  -H "Content-Type: application/json" \
  -d '{
    "discordUserId": "YOUR_DISCORD_USER_ID",
    "guildId": "YOUR_GUILD_ID"
  }'
```

Expected response:
```json
{
  "success": true,
  "rolesAssigned": 2,
  "message": "Discord roles synced successfully"
}

```

Check your Discord server - you should now have roles assigned!

### 4. How Roles Are Determined

**Talent (Professional) Users:**
- Skill Level: Based on `profiles.skill_level` (from assessments)
- User Type: 🎨 Talent badge (Green #10B981)
- Boost Tier: If they have an active `professional_promotions` record:
  - Standard: ⭐ Standard Boost (Green)
  - Premium: 💎 Premium Boost (Purple)
  - Featured: 🏆 Featured Boost (Gold)

**Employer Users:**
- User Type: 💼 Employer badge (Blue #3B82F6)
- Subscription Tier: From `organizations.subscription_tier`:
  - Free: 🆓 Free Tier (Gray)
  - Basic: 📦 Basic Plan (Green)
  - Professional: ⚡ Professional Plan (Blue)
  - Enterprise: 🏢 Enterprise Plan (Amber)

### 5. Role Colors

| Role | Color | Hex |
|------|-------|-----|
| Unverified | Gray | #9CA3AF |
| Junior Developer | Green | #10B981 |
| Mid Developer | Blue | #3B82F6 |
| Senior Developer | Purple | #8B5CF6 |
| Lead Developer | Amber | #F59E0B |
| Talent | Green | #10B981 |
| Employer | Blue | #3B82F6 |
| Free Tier | Gray | #9CA3AF |
| Basic Plan | Green | #10B981 |
| Professional Plan | Blue | #3B82F6 |
| Enterprise Plan | Amber | #F59E0B |
| Standard Boost | Green | #10B981 |
| Premium Boost | Purple | #8B5CF6 |
| Featured Boost | Gold | #EAB308 |

### 6. Auto-Sync Triggers

**Coming Soon - Manual implementation needed:**

Add these to trigger automatic role syncs:

#### After Assessment Completion
In `app/professional/assessments/page.tsx` after skill level changes:
```typescript
// After assessment completion updates skill_level
await fetch('/api/discord/sync-roles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ discordUserId, guildId: process.env.DISCORD_GUILD_ID })
})
```

#### After Subscription Changes
In Stripe webhook handler `app/api/stripe/webhook/route.ts`:
```typescript
case 'customer.subscription.updated':
case 'customer.subscription.deleted':
  // Sync Discord roles for the employer
  await fetch('/api/discord/sync-roles', { ... })
```

#### After Boost Purchase
In professional promotions creation:
```typescript
// After inserting into professional_promotions
await fetch('/api/discord/sync-roles', { ... })
```

#### On First Discord Login
In `components/AuthForm.tsx` after successful Discord OAuth:
```typescript
if (provider === 'discord' && user?.user_metadata?.provider_id) {
  await fetch('/api/discord/sync-roles', {
    body: JSON.stringify({
      discordUserId: user.user_metadata.provider_id,
      guildId: process.env.NEXT_PUBLIC_DISCORD_GUILD_ID
    })
  })
}
```

### 7. Rate Limits
- API endpoint limited to **5 requests per minute** per user
- Discord API calls are logged for cost tracking
- All role assignments are audit logged to `security_audit_log`

### 8. Security
- Requires authentication via Supabase
- Only syncs roles for the authenticated user
- Rate limited to prevent abuse
- All actions logged to audit log

### 9. Troubleshooting

**Bot not assigning roles:**
- Check bot has "Manage Roles" permission
- Verify bot's role is higher than ProofStack roles in Discord's role hierarchy
- Check bot token is valid: `echo $env:DISCORD_BOT_TOKEN` (PowerShell)

**Rate limit errors:**
- Wait 1 minute before retrying
- Each user limited to 5 syncs/min

**Profile not found:**
- Ensure user has completed ProofStack profile
- Check `profiles.auth_uid` matches Supabase user ID

**Roles not updating:**
- Old roles are automatically removed before adding new ones
- Check console logs for Discord API errors

### 10. Files Reference

| File | Purpose |
|------|---------|
| `lib/discordRoles.ts` | Role configuration (names, colors) |
| `lib/discordClient.ts` | Discord REST API wrapper |
| `app/api/discord/sync-roles/route.ts` | Sync endpoint |

### 11. Next Steps

1. ✅ Get Discord server ID and update `.env.local`
2. ✅ Invite bot to server (if not already there)
3. ✅ Test manual role sync
4. ⏸️ Add auto-sync triggers (optional)
5. ⏸️ Deploy to Vercel with env vars
6. ⏸️ Test on production

## Questions?

Check the bot logs in VS Code terminal or Discord Developer Portal → Applications → ProofStack Bot → Bot → View Logs.
