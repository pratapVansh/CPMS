# Email Notification System - Quick Start Guide

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install nodemailer @types/nodemailer
```

### 2. Run Database Migration
```bash
npx prisma migrate dev --name add_notification_system
```

### 3. Configure SMTP Settings

Login as SuperAdmin and navigate to Settings:

1. **SMTP Configuration Section:**
   - SMTP Host: `smtp.gmail.com` (or your provider)
   - SMTP Port: `587`
   - SMTP User: `your-email@gmail.com`
   - SMTP Password: Your email password or app password
   - SMTP Secure: Check if using port 465, uncheck for 587
   - Email From: `noreply@yourinstitution.edu`
   - Email From Name: `Your Institution Placement Cell`

2. **Institution Information:**
   - Institution Name: Your college name
   - Contact Email: `placement@yourinstitution.edu`
   - Contact Phone: Your placement office phone

3. **Notification Settings:**
   - Enable Email Notifications: ✓
   - Notify Application Status: ✓
   - Notify New Drive: ✓

### 4. Test SMTP Connection

Run this test script to verify SMTP configuration:

```bash
# Create a test script
cat > src/scripts/testEmailSystem.ts << 'EOF'
import { verifySmtpConnection, sendTestEmail } from '../services/email.service';

async function testEmailSystem() {
  console.log('Testing SMTP connection...');
  
  try {
    await verifySmtpConnection();
    console.log('✅ SMTP connection successful!');
    
    // Send a test email
    const testEmail = 'your-test-email@example.com';
    const result = await sendTestEmail(
      testEmail,
      'CPMS Test Email',
      'If you receive this, the email system is working correctly!'
    );
    
    if (result.success) {
      console.log(`✅ Test email sent successfully to ${testEmail}`);
      console.log(`Message ID: ${result.messageId}`);
    } else {
      console.error('❌ Failed to send test email:', result.error);
    }
  } catch (error: any) {
    console.error('❌ SMTP test failed:', error.message);
  }
}

testEmailSystem();
EOF

# Run the test
npx ts-node src/scripts/testEmailSystem.ts
```

### 5. Start the Backend Services

```bash
# Start backend (API server)
npm run dev

# In a separate terminal, start the email worker
npx ts-node src/jobs/email.processor.ts
```

## Usage Examples

### Send Welcome Email on Registration
Automatically triggered when a student registers:
```typescript
// This is already integrated in auth.service.ts
notifyStudentRegistration(user.id).catch(console.error);
```

### Send Application Confirmation
Automatically triggered when student applies:
```typescript
// This is already integrated in student.service.ts
notifyApplicationSubmitted(application.id).catch(console.error);
```

### Send Status Change Notification
Automatically triggered when admin updates application status:
```typescript
// This is already integrated in admin.service.ts
if (oldStatus !== status) {
  await notifyApplicationStatusChange(applicationId);
}
```

### Send Bulk Drive Announcement
Automatically triggered when admin creates a new company/drive:
```typescript
// This is already integrated in admin.service.ts
await notifyNewDrivePublished(company.id);
```

## Monitoring

### Check Worker Status
```bash
# Check if worker process is running
ps aux | grep "email.processor"

# View worker logs (if using PM2)
pm2 logs email-worker
```

### Check Email Queue Status
```bash
# Connect to Redis
redis-cli

# Check queue stats
LLEN bull:emailQueue:wait      # Waiting jobs
LLEN bull:emailQueue:active    # Processing jobs
LLEN bull:emailQueue:failed    # Failed jobs
```

### Check Email Activity in Database
```sql
-- Recent email activity
SELECT * FROM audit_logs 
WHERE action IN ('EMAIL_SENT', 'EMAIL_FAILED')
ORDER BY created_at DESC
LIMIT 50;

-- Failed emails in last 24 hours
SELECT * FROM notification_logs
WHERE status = 'FAILED'
  AND created_at > NOW() - INTERVAL '24 hours';
```

## Common SMTP Providers

### Gmail
```
Host: smtp.gmail.com
Port: 587
Secure: false
Note: Use App Password (not regular password)
Generate at: https://myaccount.google.com/apppasswords
```

### Outlook/Office 365
```
Host: smtp.office365.com
Port: 587
Secure: false
```

### SendGrid
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: Your SendGrid API Key
```

### Mailgun
```
Host: smtp.mailgun.org
Port: 587
User: postmaster@yourdomain.mailgun.org
Password: Your Mailgun SMTP password
```

### AWS SES
```
Host: email-smtp.us-east-1.amazonaws.com (adjust region)
Port: 587
User: Your SES SMTP Username
Password: Your SES SMTP Password
```

## Testing Individual Features

### 1. Test Welcome Email
```typescript
// Create a test student and trigger registration
await notifyStudentRegistration('test-user-id');
```

### 2. Test Status Change Email
```typescript
// Update an application status (triggers notification)
await updateApplicationStatus({
  applicationId: 'test-app-id',
  status: ApplicationStatus.SHORTLISTED
});
```

### 3. Test Drive Announcement
```typescript
// Create a new company/drive (triggers bulk notification)
await createCompany({
  name: 'Test Company',
  roleOffered: 'Software Engineer',
  // ... other fields
});
```

## Troubleshooting

### Problem: "SMTP connection failed"
**Solution:**
1. Check SMTP credentials in settings
2. For Gmail: Enable "Less secure app access" or use App Password
3. Check firewall/network allows outbound port 587/465
4. Verify SMTP server address is correct

### Problem: "No emails being sent"
**Solution:**
1. Check if email worker is running
2. Verify Redis is running: `redis-cli ping`
3. Check notification settings (Email Notifications enabled)
4. Review worker logs for errors

### Problem: "Emails going to spam"
**Solution:**
1. Use institutional email domain (not Gmail/Yahoo)
2. Set up SPF, DKIM, DMARC records for your domain
3. Use professional email content (already implemented)
4. Add "no-reply" or "noreply" to sender address

### Problem: "Duplicate emails"
**Solution:**
1. Ensure only one worker instance is running
2. Check application status is actually changing (idempotency built-in)
3. Review audit logs for duplicate entries

## Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start npm --name "cpms-backend" -- run dev

# Start email worker
pm2 start npx --name "cpms-email-worker" -- ts-node src/jobs/email.processor.ts

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

### Using Docker
Already configured in your `docker-compose.yml`:
```yaml
worker:
  build:
    context: ./backend
    dockerfile: Dockerfile
  command: npm run worker  # Add this script to package.json
  environment:
    - NODE_ENV=production
  depends_on:
    - redis
    - postgres
```

Add to `package.json`:
```json
{
  "scripts": {
    "worker": "ts-node src/jobs/email.processor.ts"
  }
}
```

### Environment Variables
Ensure these are set:
```bash
# .env
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=production
```

## Security Best Practices

1. **SMTP Password:** Store in environment variables, not code
2. **Email Validation:** Already validated in templates
3. **Rate Limiting:** Already implemented (10/min)
4. **Error Handling:** Already implemented with retries
5. **Audit Logging:** Already tracking all email activity

## Performance Tuning

### For High Volume (1000+ students)
```typescript
// Increase concurrency in email.processor.ts
concurrency: 10  // up from 3

// Increase rate limit
limiter: {
  max: 50,        // up from 10
  duration: 60000 // per minute
}
```

### For Low Volume (<100 students)
Keep default settings (3 concurrent, 10/min) to avoid overwhelming SMTP server.

## Next Steps

1. ✅ SMTP configured and tested
2. ✅ Worker running and processing jobs
3. ✅ Test welcome email on new registration
4. ✅ Test application confirmation on new application
5. ✅ Test status change notifications
6. ✅ Test drive announcement for multiple students
7. Monitor queue and logs for first few days
8. Adjust rate limits/concurrency based on volume
9. Set up monitoring/alerts for failed jobs
10. Configure email domain SPF/DKIM for production

## Support

If you encounter issues:
1. Check worker logs
2. Review NOTIFICATION_SYSTEM.md documentation
3. Test SMTP connection
4. Verify Redis is running
5. Check database for notification logs

---

**Quick Reference:**
- Documentation: `NOTIFICATION_SYSTEM.md`
- Email Templates: `src/templates/emailTemplates.ts`
- Email Service: `src/services/email.service.ts`
- Notification Service: `src/services/notification.service.ts`
- Email Worker: `src/jobs/email.processor.ts`
