# Bulk Communication System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Prerequisites
- CPMS backend running
- Database configured
- SMTP settings configured in admin panel

### Step 1: Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_bulk_communication
npx prisma generate
```

### Step 2: Restart Backend

```bash
npm run dev
```

### Step 3: Test the Feature

1. Login as Admin
2. Go to Drives → Select a Company
3. Click "Send Bulk Message" button
4. You're ready to go! ✨

---

## 📨 Sending Your First Bulk Message

### Scenario: Notify Shortlisted Students

1. **Open Bulk Message Modal**
   - Navigate to: Admin → Drives → [Select Company]
   - Click "Send Bulk Message" button

2. **Configure Campaign**
   ```
   Campaign Name: Shortlist Notification - Round 1
   ```

3. **Create Message Block**
   - **Target:** By Status → Shortlisted
   - **Subject:** `Congratulations! You've been shortlisted for {{company_name}}`
   - **Body:**
   ```
   Dear {{student_name}},

   Congratulations! You have been shortlisted for {{company_name}}.
   
   Next Round: Technical Interview
   Date: {{date}}
   
   Please prepare accordingly.
   
   Best regards,
   Placement Cell
   ```

4. **Preview**
   - Click "Preview" to see how it looks
   - Verify recipient count

5. **Send**
   - Click "Confirm & Send"
   - Monitor progress

---

## 🎯 Common Use Cases

### Use Case 1: Notify All Shortlisted Students

**Target:** By Status → Shortlisted  
**Template:**
```
Subject: Interview Schedule - {{company_name}}
Body: Dear {{student_name}}, you are invited to attend...
```

### Use Case 2: Send Different Messages to Different Groups

**Message Block 1 (Shortlisted):**
```
Subject: Congratulations - {{company_name}}
Target: By Status → Shortlisted
```

**Message Block 2 (Remaining):**
```
Subject: Application Status - {{company_name}}
Target: Remaining Applicants (N-X)
```

### Use Case 3: Send to Manually Selected Students

1. Use checkboxes to select specific students (e.g., 5 students)
2. In modal, choose: **Target → Selected Applicants (5)**
3. Compose personalized message
4. Send

---

## 📝 Template Variables Reference

| Variable             | Output Example        |
|---------------------|-----------------------|
| `{{student_name}}`   | John Doe              |
| `{{company_name}}`   | Google Inc            |
| `{{date}}`           | 07 February, 2026     |
| `{{student_branch}}` | Computer Science      |
| `{{student_cgpa}}`   | 8.50                  |

**Example:**
```
Dear {{student_name}},

Your application for {{company_name}} has been reviewed.
Your CGPA of {{student_cgpa}} meets our requirements.

Date: {{date}}
```

---

## ⚡ API Quick Reference

### Create Campaign
```bash
POST /admin/drives/:driveId/campaigns

{
  "name": "Campaign Name",
  "messageBlocks": [{
    "blockOrder": 1,
    "targetType": "STATUS",
    "targetValue": "SHORTLISTED",
    "subject": "Subject with {{student_name}}",
    "body": "Email body..."
  }]
}
```

### Send Campaign
```bash
POST /admin/campaigns/:campaignId/send

{
  "confirmSend": true
}
```

### Preview Email
```bash
POST /admin/drives/:driveId/preview-email

{
  "subject": "Test {{student_name}}",
  "body": "Hello {{student_name}}..."
}
```

---

## 🔍 Testing Checklist

Before sending to real students:

- [ ] Campaign name is descriptive
- [ ] Recipient count is correct
- [ ] Template variables are properly formatted
- [ ] Preview looks good
- [ ] Subject line is clear
- [ ] Email body is professional
- [ ] Contact information included
- [ ] No typos or errors

---

## 🐛 Quick Troubleshooting

**Problem:** Emails not sending  
**Solution:** Check `System Settings → SMTP Configuration`

**Problem:** Template variables not replaced  
**Solution:** Use `{{variable}}` with double braces

**Problem:** Zero recipients  
**Solution:** Verify students have applied to the drive

**Problem:** Modal not opening  
**Solution:** Check browser console for errors, refresh page

---

## 📚 Learn More

For detailed documentation, see:
- [Full Documentation](./BULK_COMMUNICATION_SYSTEM.md)
- [API Reference](./BULK_COMMUNICATION_SYSTEM.md#api-endpoints)
- [Troubleshooting Guide](./BULK_COMMUNICATION_SYSTEM.md#troubleshooting)

---

**Need Help?** Check the main documentation or contact your system administrator.

Happy Messaging! 📬
