# Email Notification System Documentation

## Overview

The CPMS Email Notification System is a production-ready, queue-based email automation system that handles all placement-related notifications. The system features professional email templates, SMTP integration, retry logic, rate limiting, and settings-based controls.

## Architecture

### Components

1. **Email Templates** (`backend/src/templates/emailTemplates.ts`)
   - 10 professional email templates for all notification types
   - Academic tone suitable for college placement cells
   - Template variables for personalization
   - Standardized footer with institution branding

2. **Email Service** (`backend/src/services/email.service.ts`)
   - SMTP configuration and transport management
   - Email sending with retry logic (3 attempts, exponential backoff)
   - Bulk email sending with rate limiting
   - Connection testing and verification
   - Settings integration for SMTP configuration

3. **Notification Service** (`backend/src/services/notification.service.ts`)
   - Central orchestration layer for all notifications
   - Event-driven architecture
   - Settings-based gating (respects notification preferences)
   - Idempotent status change notifications
   - Bulk notification support

4. **Queue System**
   - **Notification Queue** (`backend/src/queues/notification.queue.ts`) - Routes notifications to appropriate channel queues
   - **Email Queue** (`backend/src/queues/email.queue.ts`) - BullMQ-based email job queue with priority support
   - **Email Processor** (`backend/src/jobs/email.processor.ts`) - Worker that processes email jobs

5. **Database Models**
   - **NotificationLog** - Tracks all notification attempts with status, metadata, and error information
   - **SystemSettings** - Controls SMTP configuration and notification preferences
   - **AuditLog** - Records EMAIL_SENT and EMAIL_FAILED actions

## Notification Types

### 1. Student Registration Welcome
**Event:** `REGISTRATION_WELCOME`
**Trigger:** When a new student registers
**Template:** Welcome message with platform orientation

### 2. Profile Incomplete
**Event:** `PROFILE_INCOMPLETE`
**Trigger:** When student profile is missing required fields
**Template:** List of missing fields with instructions to complete

### 3. Application Submitted
**Event:** `APPLICATION_SUBMITTED`
**Trigger:** When student applies to a company/drive
**Template:** Confirmation with application details and next steps

### 4. Application Under Review
**Event:** `APPLICATION_UNDER_REVIEW`
**Trigger:** Admin changes status to UNDER_REVIEW
**Template:** Notification that application is being reviewed

### 5. Application Shortlisted
**Event:** `APPLICATION_SHORTLISTED`
**Trigger:** Admin changes status to SHORTLISTED
**Priority:** HIGH
**Template:** Congratulations with interview/selection round details

### 6. Application Selected
**Event:** `APPLICATION_SELECTED`
**Trigger:** Admin changes status to SELECTED
**Priority:** URGENT
**Template:** Offer letter notification with instructions

### 7. Application Rejected
**Event:** `APPLICATION_REJECTED`
**Trigger:** Admin changes status to REJECTED
**Template:** Polite rejection with encouragement

### 8. Application On Hold
**Event:** `APPLICATION_ON_HOLD`
**Trigger:** Admin changes status to ON_HOLD
**Template:** Notification that application is temporarily on hold

### 9. New Drive Published
**Event:** `NEW_DRIVE_PUBLISHED`
**Trigger:** Admin creates new company/drive
**Template:** Announcement with drive details and application instructions
**Recipients:** All eligible students (branch, CGPA, year filters applied)

### 10. Drive Deadline Reminder
**Event:** `DRIVE_DEADLINE_REMINDER`
**Trigger:** Manual trigger (can be scheduled via cron job)
**Template:** Reminder for students who haven't applied yet

## Integration Points

### 1. Student Registration
**File:** `backend/src/services/auth.service.ts`
**Function:** `register()`
**Integration:**
```typescript
notifyStudentRegistration(user.id).catch(error => {
  console.error('Failed to send welcome email:', error);
});
```

### 2. Application Submission
**File:** `backend/src/services/student.service.ts`
**Function:** `applyToCompany()`
**Integration:**
```typescript
notifyApplicationSubmitted(application.id).catch(error => {
  console.error('Failed to send application confirmation email:', error);
});
```

### 3. Application Status Change
**File:** `backend/src/services/admin.service.ts`
**Function:** `updateApplicationStatus()`
**Integration:**
```typescript
if (oldStatus !== status) {
  try {
    await notifyApplicationStatusChange(applicationId);
  } catch (error) {
    console.error('Failed to send notification for status change:', error);
  }
}
```

### 4. New Drive Published
**File:** `backend/src/services/admin.service.ts`
**Function:** `createCompany()`
**Integration:**
```typescript
try {
  await notifyNewDrivePublished(company.id);
} catch (error) {
  console.error('Failed to send new drive notifications:', error);
}
```

## Configuration

### SMTP Settings
Configure in SuperAdmin Settings page:
- **SMTP Host:** mail.example.com
- **SMTP Port:** 587 (or 465 for SSL)
- **SMTP User:** noreply@institution.edu
- **SMTP Password:** (encrypted in database)
- **SMTP Secure:** true/false
- **Email From:** noreply@institution.edu
- **Email From Name:** Institution Placement Cell

### Institution Settings
- **Institution Name:** Used in email templates
- **Contact Email:** Support email shown in footers
- **Contact Phone:** Support phone shown in footers
- **Website URL:** Link in email footers

### Notification Preferences
- **Email Notifications:** Enable/disable all email notifications
- **Notify Application Status:** Enable/disable status change emails
- **Notify New Drive:** Enable/disable new drive announcement emails

## Queue Configuration

### Email Queue
- **Queue Name:** `emailQueue`
- **Concurrency:** 3 workers
- **Rate Limit:** 10 emails per minute
- **Retry Logic:** 3 attempts with exponential backoff (5s initial delay)
- **Job Priority:** URGENT=1, HIGH=2, NORMAL=3, LOW=5

## Error Handling

### Email Sending Failures
1. **Retry Logic:** Automatically retries 3 times with exponential backoff
2. **Audit Logging:** All failures logged to AuditLog with error details
3. **Queue Monitoring:** Failed jobs logged with attempt count
4. **Manual Intervention:** Jobs failing after 3 attempts require manual review

### Common Issues

#### 1. SMTP Connection Failed
- **Cause:** Invalid SMTP credentials or unreachable server
- **Solution:** Test SMTP connection in settings, verify credentials
- **Log:** Check email worker logs for connection errors

#### 2. Template Not Found
- **Cause:** Invalid event type or missing template mapping
- **Solution:** Verify eventType matches template definitions
- **Log:** Worker logs will show "No template found for event type"

#### 3. User Email Not Found
- **Cause:** UserId doesn't exist or user has no email
- **Solution:** Verify user exists before queueing notification
- **Log:** Worker logs will show "User email not found"

## Testing

### 1. Test SMTP Connection
Use the email service test function:
```typescript
import { sendTestEmail, verifySmtpConnection } from './services/email.service';

// Test connection
await verifySmtpConnection();

// Send test email
await sendTestEmail('test@example.com', 'Test Subject', 'Test Body');
```

### 2. Test Individual Notification
```typescript
import { notifyStudentRegistration } from './services/notification.service';

await notifyStudentRegistration('user-id-123');
```

### 3. Monitor Queue
Check Redis for job status:
```bash
# View waiting jobs
redis-cli LLEN bull:emailQueue:wait

# View active jobs
redis-cli LLEN bull:emailQueue:active

# View failed jobs
redis-cli LLEN bull:emailQueue:failed
```

### 4. Check Audit Logs
Query database for email activity:
```sql
SELECT * FROM audit_logs 
WHERE action IN ('EMAIL_SENT', 'EMAIL_FAILED') 
ORDER BY created_at DESC 
LIMIT 100;
```

## Database Schema

### NotificationLog Model
```prisma
model NotificationLog {
  id             String              @id @default(uuid())
  userId         String
  eventType      String              // Event type constant
  channel        NotificationChannel // EMAIL, SMS, PUSH
  status         NotificationStatus  // PENDING, SENT, FAILED, RETRY
  recipientEmail String?
  recipientPhone String?
  subject        String?
  message        String?             @db.Text
  metadata       Json?               // Additional context
  error          String?             @db.Text
  attempts       Int                 @default(0)
  sentAt         DateTime?
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  
  user           User                @relation(...)
}
```

### Enums
```prisma
enum NotificationChannel {
  EMAIL
  SMS
  PUSH
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  RETRY
}

enum ApplicationStatus {
  APPLIED
  SHORTLISTED
  REJECTED
  SELECTED
  UNDER_REVIEW
  PROFILE_INCOMPLETE
  ON_HOLD
}
```

## Migration

Migration created: `20260204153833_add_notification_system`

### Changes Made
1. Added `NotificationChannel` enum
2. Added `NotificationStatus` enum
3. Added `UNDER_REVIEW`, `PROFILE_INCOMPLETE`, `ON_HOLD` to ApplicationStatus enum
4. Created `NotificationLog` model
5. Added `notifications` relation to User model

## Maintenance

### Regular Maintenance Tasks

#### 1. Clean Old Notification Logs
```sql
-- Delete notification logs older than 90 days
DELETE FROM notification_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

#### 2. Monitor Failed Jobs
```sql
-- Check recent failed notifications
SELECT nl.*, u.email 
FROM notification_logs nl
JOIN users u ON nl.user_id = u.id
WHERE nl.status = 'FAILED' 
  AND nl.created_at > NOW() - INTERVAL '24 hours'
ORDER BY nl.created_at DESC;
```

#### 3. Queue Health Check
- Monitor Redis memory usage
- Check queue length (should not grow indefinitely)
- Review worker logs for errors
- Verify worker process is running

### Performance Optimization

#### 1. Rate Limiting
Current: 10 emails/minute
Adjust in `email.processor.ts` if needed:
```typescript
limiter: {
  max: 10,        // Adjust this
  duration: 60000 // per minute
}
```

#### 2. Concurrency
Current: 3 concurrent workers
Adjust in `email.processor.ts`:
```typescript
concurrency: 3  // Adjust this
```

#### 3. Bulk Notifications
For large batches (new drive to 500+ students):
- Use `notifyNewDrivePublished()` which handles batching
- Monitor queue length and worker throughput
- Consider increasing concurrency for bulk operations

## Future Enhancements

### Planned Features
1. **SMS Notifications:** Implement SMS channel using Twilio/SNS
2. **Push Notifications:** Implement web push notifications
3. **Email Templates Editor:** Admin UI to customize email templates
4. **Scheduled Notifications:** Cron-based deadline reminders
5. **Notification Preferences:** Student-level notification settings
6. **Rich Email Templates:** HTML templates with images and styling
7. **Delivery Analytics:** Open rates, click tracking
8. **A/B Testing:** Test different email templates

### Extension Points
- `backend/src/queues/notification.queue.ts` - Add SMS/Push queue handlers
- `backend/src/templates/emailTemplates.ts` - Add new template types
- `backend/src/services/notification.service.ts` - Add new notification functions

## Troubleshooting

### Problem: Emails not being sent
1. Check SMTP settings in database
2. Verify worker is running: `ps aux | grep node`
3. Check worker logs for errors
4. Test SMTP connection: Use `verifySmtpConnection()`
5. Check Redis connection: `redis-cli ping`

### Problem: Duplicate emails
- **Cause:** Multiple worker instances or retry logic
- **Solution:** Ensure only one worker instance, check idempotency in `notifyApplicationStatusChange`

### Problem: Slow email delivery
- **Cause:** Low concurrency, rate limiting, or SMTP throttling
- **Solution:** Increase concurrency, adjust rate limits, verify SMTP server limits

### Problem: Template variables missing
- **Cause:** Data not passed correctly to template
- **Solution:** Check notification service passes all required variables, verify template variable names match

## Support

For issues or questions:
1. Check worker logs: `docker logs cpms-worker` or application logs
2. Review audit logs in database
3. Check notification logs for failure details
4. Verify SMTP configuration in settings
5. Test individual components (SMTP, templates, queue)

---

**Last Updated:** February 4, 2026
**Version:** 1.0.0
**Author:** CPMS Development Team
