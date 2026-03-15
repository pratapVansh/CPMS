/**
 * Email Templates for Campus Placement Management System
 */

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface TemplateVariables {
  studentName: string;
  studentRollNo?: string;
  studentEmail?: string;
  companyName?: string;
  driveName?: string;
  roleName?: string;
  institutionName: string;
  institutionEmail?: string;
  institutionPhone?: string;
  placementOfficerName?: string;
  deadline?: string;
  driveDate?: string;
  ctc?: string;
  location?: string;
  additionalInfo?: string;
  profileIssues?: string[];
  rejectionReason?: string;
  nextSteps?: string;
}

function getStudentGreeting(studentName: string, rollNo?: string): string {
  if (rollNo) {
    return `<strong>${studentName}</strong> (Roll No: <strong>${rollNo}</strong>)`;
  }
  return `<strong>${studentName}</strong>`;
}

function getEmailFooter(variables: TemplateVariables): string {
  return `
    <div style="margin-top: 40px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
      <p style="margin: 0 0 8px 0; font-size: 16px; color: #111827;">
        <strong>Warm regards,<br/>Placement & Training Cell</strong>
      </p>
      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #374151;">
        ${variables.institutionName}
      </p>
      ${variables.institutionEmail ? `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">📧 <a href="mailto:${variables.institutionEmail}" style="color: #2563eb; text-decoration: none;">${variables.institutionEmail}</a></p>` : ''}
      ${variables.institutionPhone ? `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;">📞 ${variables.institutionPhone}</p>` : ''}
      <p style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; font-style: italic; line-height: 1.5;">
        This is an automated message from the Campus Placement Management System. Please do not reply to this email.
      </p>
    </div>
  `;
}

function wrapInHtmlTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campus Placement Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="padding: 40px 32px;">
      ${content}
    </div>
  </div>
</body>
</html>
  `;
}

export function getRegistrationWelcomeTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear ${getStudentGreeting(variables.studentName, variables.studentRollNo)},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">
      Welcome to the ${variables.institutionName} Campus Placement Portal!
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Your account has been successfully registered. You can now access the placement portal to:
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 24px; color: #374151;">
      <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Browse upcoming placement drives</li>
      <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Update your profile and upload documents</li>
      <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Apply to companies that match your eligibility</li>
      <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Track your application status</li>
      <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Receive important placement notifications</li>
    </ul>
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
      If you have any questions or need assistance, please contact the Placement Cell.
    </p>
    ${getEmailFooter(variables)}
  `;
  return {
    subject: `Welcome to ${variables.institutionName} Placement Portal`,
    body: wrapInHtmlTemplate(content),
  };
}

export function getProfileIncompleteTemplate(variables: TemplateVariables): EmailTemplate {
  const issuesList = variables.profileIssues?.map(issue =>
    `<li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">${issue}</li>`
  ).join('') || '<li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">Missing required information</li>';

  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear ${getStudentGreeting(variables.studentName, variables.studentRollNo)},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      We noticed that your placement profile is <strong>incomplete</strong>.
    </p>
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #92400e;">Missing/Required Information:</p>
      <ul style="margin: 0; padding-left: 20px; color: #92400e;">${issuesList}</ul>
    </div>
    ${getEmailFooter(variables)}
  `;
  return {
    subject: `Action Required: Complete Your Placement Profile`,
    body: wrapInHtmlTemplate(content),
  };
}

export function getApplicationSubmittedTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear ${getStudentGreeting(variables.studentName, variables.studentRollNo)},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Your application for <strong>${variables.companyName} - ${variables.roleName}</strong> has been successfully submitted.
    </p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0;">
      <ul style="margin: 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Company:</strong> ${variables.companyName}</li>
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Role:</strong> ${variables.roleName}</li>
        ${variables.ctc ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>CTC:</strong> ${variables.ctc}</li>` : ''}
        ${variables.location ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Location:</strong> ${variables.location}</li>` : ''}
      </ul>
    </div>
    ${getEmailFooter(variables)}
  `;
  return {
    subject: `Application Submitted: ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

export function getApplicationUnderReviewTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear ${getStudentGreeting(variables.studentName, variables.studentRollNo)},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Your application for <strong>${variables.companyName} - ${variables.roleName}</strong> is currently under review.
    </p>
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #92400e;">Current Status: Under Review</p>
    </div>
    ${getEmailFooter(variables)}
  `;
  return {
    subject: `Application Under Review: ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

export function getApplicationShortlistedTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear ${getStudentGreeting(variables.studentName, variables.studentRollNo)},
    </p>
    <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 24px;">🎉</p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #065f46;">Congratulations!</p>
    </div>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      You have been <strong>shortlisted</strong> by <strong>${variables.companyName}</strong> for the role of <strong>${variables.roleName}</strong>.
    </p>
    ${getEmailFooter(variables)}
  `;
  return {
    subject: `🎉 Congratulations! You're Shortlisted - ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

export function getApplicationSelectedTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear ${getStudentGreeting(variables.studentName, variables.studentRollNo)},
    </p>
    <div style="background-color: #f0fdf4; border: 3px solid #10b981; border-radius: 8px; padding: 32px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 12px 0; font-size: 32px;">🎉</p>
      <p style="margin: 0; font-size: 22px; font-weight: 700; color: #065f46;">Heartiest congratulations!</p>
    </div>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      You have been <strong>selected by ${variables.companyName}</strong> for the position of <strong>${variables.roleName}</strong>.
    </p>
    ${getEmailFooter(variables)}
  `;
  return {
    subject: `🎊 Congratulations on Your Selection - ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

export function getApplicationRejectedTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear ${getStudentGreeting(variables.studentName, variables.studentRollNo)},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      After careful consideration, we regret to inform you that your application to <strong>${variables.companyName}</strong> for the role of <strong>${variables.roleName}</strong> has not been selected.
    </p>
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; font-size: 15px; color: #1e40af; line-height: 1.6;">
        Please do not be disheartened. Keep preparing and look out for upcoming drives.
      </p>
    </div>
    ${variables.rejectionReason ? `
    <div style="background-color: #f9fafb; border-left: 4px solid #9ca3af; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #374151;">Feedback:</p>
      <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">${variables.rejectionReason}</p>
    </div>
    ` : ''}
    ${getEmailFooter(variables)}
  `;
  return {
    subject: `Application Status Update: ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

export function getApplicationOnHoldTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear ${getStudentGreeting(variables.studentName, variables.studentRollNo)},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Your application for <strong>${variables.companyName} - ${variables.roleName}</strong> is currently <strong>on hold</strong>.
    </p>
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #92400e;">Current Status: On Hold</p>
    </div>
    ${getEmailFooter(variables)}
  `;
  return {
    subject: `Application Status: On Hold - ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

export function getNewDrivePublishedTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear ${getStudentGreeting(variables.studentName, variables.studentRollNo)},
    </p>
    <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 24px;">🔔</p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #1e40af;">New Placement Opportunity Available!</p>
    </div>
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0;">
      <ul style="margin: 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Company:</strong> ${variables.companyName}</li>
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Role:</strong> ${variables.roleName}</li>
        ${variables.ctc ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>CTC:</strong> ${variables.ctc}</li>` : ''}
        ${variables.location ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Location:</strong> ${variables.location}</li>` : ''}
        ${variables.deadline ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Application Deadline:</strong> ${variables.deadline}</li>` : ''}
      </ul>
    </div>
    ${getEmailFooter(variables)}
  `;
  return {
    subject: `🔔 New Placement Drive: ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

export function getDriveDeadlineReminderTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear ${getStudentGreeting(variables.studentName, variables.studentRollNo)},
    </p>
    <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 32px;">⏰</p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #92400e;">Deadline Approaching Soon!</p>
    </div>
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0;">
      <ul style="margin: 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 8px; font-size: 15px; color: #92400e;"><strong>Company:</strong> ${variables.companyName}</li>
        <li style="margin-bottom: 8px; font-size: 15px; color: #92400e;"><strong>Role:</strong> ${variables.roleName}</li>
        ${variables.deadline ? `<li style="margin-bottom: 8px; font-size: 16px; font-weight: 700; color: #92400e;"><strong>⚠️ Deadline:</strong> ${variables.deadline}</li>` : ''}
      </ul>
    </div>
    ${getEmailFooter(variables)}
  `;
  return {
    subject: `⏰ Reminder: Apply Soon - ${variables.companyName} (Deadline Approaching)`,
    body: wrapInHtmlTemplate(content),
  };
}

export function getTemplateByEvent(
  eventType: string,
  variables: TemplateVariables
): EmailTemplate | null {
  const templates: Record<string, (vars: TemplateVariables) => EmailTemplate> = {
    REGISTRATION_WELCOME: getRegistrationWelcomeTemplate,
    PROFILE_INCOMPLETE: getProfileIncompleteTemplate,
    APPLICATION_SUBMITTED: getApplicationSubmittedTemplate,
    APPLICATION_UNDER_REVIEW: getApplicationUnderReviewTemplate,
    APPLICATION_SHORTLISTED: getApplicationShortlistedTemplate,
    APPLICATION_SELECTED: getApplicationSelectedTemplate,
    APPLICATION_REJECTED: getApplicationRejectedTemplate,
    APPLICATION_ON_HOLD: getApplicationOnHoldTemplate,
    NEW_DRIVE_PUBLISHED: getNewDrivePublishedTemplate,
    DRIVE_DEADLINE_REMINDER: getDriveDeadlineReminderTemplate,
  };

  const templateFn = templates[eventType];
  return templateFn ? templateFn(variables) : null;
}

export function getEventFromApplicationStatus(status: string): string | null {
  const statusToEvent: Record<string, string> = {
    APPLIED: 'APPLICATION_SUBMITTED',
    UNDER_REVIEW: 'APPLICATION_UNDER_REVIEW',
    PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
    SHORTLISTED: 'APPLICATION_SHORTLISTED',
    SELECTED: 'APPLICATION_SELECTED',
    REJECTED: 'APPLICATION_REJECTED',
    ON_HOLD: 'APPLICATION_ON_HOLD',
  };
  return statusToEvent[status] || null;
}
