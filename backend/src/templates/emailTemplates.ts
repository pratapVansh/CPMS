/**
 * Email Templates for Campus Placement Management System
 * 
 * All templates use proper HTML formatting for professional email rendering.
 */

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface TemplateVariables {
  studentName: string;
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

/**
 * Email Footer Template (HTML)
 */
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

/**
 * Wrap content in HTML email template
 */
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

/**
 * Student Registration Welcome Email
 */
export function getRegistrationWelcomeTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${variables.studentName}</strong>,
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
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Next Steps:</p>
      <ol style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Complete your profile with accurate information</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Upload your latest resume (PDF format)</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Upload your academic marksheets</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Review eligibility criteria before applying to drives</li>
      </ol>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1e40af;">Important Guidelines:</p>
      <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">Keep your profile updated at all times</li>
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">Apply only to companies where you meet the eligibility criteria</li>
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">Maintain professionalism in all placement-related communications</li>
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">Attend pre-placement talks and interviews as scheduled</li>
      </ul>
    </div>
    
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

/**
 * Profile Incomplete Notification
 */
export function getProfileIncompleteTemplate(variables: TemplateVariables): EmailTemplate {
  const issuesList = variables.profileIssues?.map(issue => 
    `<li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">${issue}</li>`
  ).join('') || '<li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">Missing required information</li>';
  
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${variables.studentName}</strong>,
    </p>
    
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      We noticed that your placement profile is <strong>incomplete</strong>. A complete profile is essential to apply for placement drives and be considered by recruiters.
    </p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #92400e;">Missing/Required Information:</p>
      <ul style="margin: 0; padding-left: 20px; color: #92400e;">
        ${issuesList}
      </ul>
    </div>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 15px; font-weight: 600; color: #991b1b;">
        ⚠️ Action Required: Please complete your profile within the next <strong>48 hours</strong>.
      </p>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Why This Matters:</p>
      <ul style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Incomplete profiles cannot apply to placement drives</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Companies require complete student information for shortlisting</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Missing documents may lead to disqualification</li>
      </ul>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">How to Complete Your Profile:</p>
      <ol style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Log in to the placement portal</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Navigate to "My Profile"</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Fill in all required fields</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Upload necessary documents (Resume, Marksheets)</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Save and verify your information</li>
      </ol>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
      If you face any technical issues or need guidance, please reach out to the Placement Cell immediately.
    </p>
    
    ${getEmailFooter(variables)}
  `;
  
  return {
    subject: `Action Required: Complete Your Placement Profile`,
    body: wrapInHtmlTemplate(content),
  };
}

/**
 * Application Submission Confirmation
 */
export function getApplicationSubmittedTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${variables.studentName}</strong>,
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Your application for <strong>${variables.companyName} - ${variables.roleName}</strong> has been successfully submitted.
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #065f46;">Application Details:</p>
      <ul style="margin: 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Company:</strong> ${variables.companyName}</li>
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Role:</strong> ${variables.roleName}</li>
        ${variables.ctc ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>CTC:</strong> ${variables.ctc}</li>` : ''}
        ${variables.location ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Location:</strong> ${variables.location}</li>` : ''}
        ${variables.driveDate ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Drive Date:</strong> ${variables.driveDate}</li>` : ''}
      </ul>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">What Happens Next:</p>
      <ol style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Your application will be reviewed by the company</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">You will be notified if you are shortlisted</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Further rounds and interview schedules will be communicated</li>
      </ol>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Important Reminders:</p>
      <ul style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Keep checking the portal for status updates</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Ensure your contact details are up-to-date</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Prepare well for potential interviews</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Attend all scheduled rounds punctually</li>
      </ul>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1e40af;">Withdrawal Policy:</p>
      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">
        If you wish to withdraw your application, please inform the Placement Cell within 24 hours. Withdrawals after shortlisting may affect your future placement opportunities.
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
      We wish you the best for the selection process!
    </p>
    
    ${getEmailFooter(variables)}
  `;
  
  return {
    subject: `Application Submitted: ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

/**
 * Application Under Review
 */
export function getApplicationUnderReviewTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${variables.studentName}</strong>,
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Your application for <strong>${variables.companyName} - ${variables.roleName}</strong> is currently under review by the company's recruitment team.
    </p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #92400e;">
        Current Status: Under Review
      </p>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">What This Means:</p>
      <ul style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Your profile is being evaluated against the job requirements</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">The company is screening applications to create a shortlist</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">You will be notified once the review is complete</li>
      </ul>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1e40af;">Timeline:</p>
      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">
        You can expect an update on your application status within the next few days. The exact timeline depends on the company's recruitment process.
      </p>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">In the Meantime:</p>
      <ul style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Keep your profile updated</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Ensure your contact information is correct</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Prepare for potential interviews</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Review the company's products/services</li>
      </ul>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
      We'll notify you immediately once there's an update on your application status.
    </p>
    
    ${getEmailFooter(variables)}
  `;
  
  return {
    subject: `Application Under Review: ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

/**
 * Application Shortlisted
 */
export function getApplicationShortlistedTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${variables.studentName}</strong>,
    </p>
    
    <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 24px;">🎉</p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #065f46;">
        Congratulations!
      </p>
    </div>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      You have been <strong>shortlisted</strong> by <strong>${variables.companyName}</strong> for the role of <strong>${variables.roleName}</strong>.
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #065f46;">Application Details:</p>
      <ul style="margin: 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Company:</strong> ${variables.companyName}</li>
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Role:</strong> ${variables.roleName}</li>
        ${variables.ctc ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>CTC:</strong> ${variables.ctc}</li>` : ''}
        ${variables.location ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Location:</strong> ${variables.location}</li>` : ''}
      </ul>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Next Steps:</p>
      <ol style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">You will receive further details about the interview process</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Attend the pre-placement talk (if scheduled)</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Prepare thoroughly for the interview rounds</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Review your resume and be ready to discuss your projects</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Research about the company, its products, and culture</li>
      </ol>
    </div>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #991b1b;">Important Instructions:</p>
      <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;"><strong>Mandatory Attendance:</strong> You must attend all scheduled rounds</li>
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;"><strong>Professional Conduct:</strong> Maintain high standards of professionalism</li>
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;"><strong>Punctuality:</strong> Arrive 15 minutes before scheduled time</li>
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;"><strong>Dress Code:</strong> Formal business attire is mandatory</li>
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;"><strong>Documents:</strong> Carry printed copies of your resume and all academic documents</li>
      </ul>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
      This is an excellent opportunity. Make the most of it by preparing well and presenting your best self. All the best! We're rooting for you!
    </p>
    
    ${getEmailFooter(variables)}
  `;
  
  return {
    subject: `🎉 Congratulations! You're Shortlisted - ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

/**
 * Application Selected
 */
export function getApplicationSelectedTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${variables.studentName}</strong>,
    </p>
    
    <div style="background-color: #f0fdf4; border: 3px solid #10b981; border-radius: 8px; padding: 32px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 12px 0; font-size: 32px;">🎉</p>
      <p style="margin: 0; font-size: 22px; font-weight: 700; color: #065f46;">
        Heartiest congratulations!
      </p>
    </div>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      We are pleased to inform you that you have been <strong>selected by ${variables.companyName}</strong> for the position of <strong>${variables.roleName}</strong>.
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #065f46;">Offer Details:</p>
      <ul style="margin: 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Company:</strong> ${variables.companyName}</li>
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Role:</strong> ${variables.roleName}</li>
        ${variables.ctc ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>CTC:</strong> ${variables.ctc}</li>` : ''}
        ${variables.location ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Location:</strong> ${variables.location}</li>` : ''}
      </ul>
    </div>
    
    <p style="margin: 24px 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      This achievement reflects your dedication, technical skills, and consistent efforts. The Placement & Training Cell congratulates you on this well-deserved success.
    </p>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Next Steps:</p>
      <ol style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">You will receive the official offer letter from the company shortly.</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Review all offer details carefully.</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Complete the required documentation within the stipulated timeline.</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Attend the offer acceptance session, if scheduled.</li>
      </ol>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #92400e;">Important Notice:</p>
      <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
        As per the institute's placement policy, acceptance of this offer may affect your eligibility for future placement drives. Please consult the Placement Cell for clarification regarding the one-offer/two-offer policy.
      </p>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Reminders:</p>
      <ul style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Maintain confidentiality of this offer until an official announcement is made.</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Do not share placement-related information on public platforms or social media.</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Stay in touch with the Placement Cell for any assistance or guidance.</li>
      </ul>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Once again, congratulations on this excellent achievement. We wish you continued success in your professional journey.
    </p>
    
    ${getEmailFooter(variables)}
  `;
  
  return {
    subject: `🎊 Congratulations on Your Selection - ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

/**
 * Application Rejected
 */
export function getApplicationRejectedTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${variables.studentName}</strong>,
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Thank you for your interest in <strong>${variables.companyName}</strong> for the role of <strong>${variables.roleName}</strong>.
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      After careful consideration, we regret to inform you that your application has <strong>not been selected</strong> for the current opportunity.
    </p>
    
    <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #374151;">What This Means:</p>
      <ul style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Your profile did not match the current requirements</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">This decision is based on various factors including role fit, technical skills, and company requirements</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">This is a normal part of the placement process and does not reflect on your overall capabilities</li>
      </ul>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1e40af;">Important Message:</p>
      <p style="margin: 0; font-size: 15px; color: #1e40af; line-height: 1.6;">
        Please do not be disheartened. The placement process involves multiple factors, and not being selected by one company doesn't define your potential. Many successful professionals faced similar situations during their campus placements.
      </p>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Moving Forward:</p>
      <ul style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;"><strong>Stay Positive:</strong> Keep your confidence high</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;"><strong>Learn & Improve:</strong> Analyze your performance and work on areas of improvement</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;"><strong>Stay Prepared:</strong> Continue preparing for upcoming drives</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;"><strong>Seek Guidance:</strong> Feel free to reach out to the Placement Cell for feedback and guidance</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;"><strong>More Opportunities:</strong> There are many more placement drives coming up</li>
      </ul>
    </div>
    
    ${variables.rejectionReason ? `
    <div style="background-color: #f9fafb; border-left: 4px solid #9ca3af; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #374151;">Feedback:</p>
      <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        ${variables.rejectionReason}
      </p>
    </div>
    ` : ''}
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Remember: Persistence and continuous improvement are key to success. Keep an eye on the placement portal for new opportunities. Your next opportunity might be just around the corner!
    </p>
    
    ${getEmailFooter(variables)}
  `;
  
  return {
    subject: `Application Status Update: ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

/**
 * Application On Hold
 */
export function getApplicationOnHoldTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${variables.studentName}</strong>,
    </p>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Your application for <strong>${variables.companyName} - ${variables.roleName}</strong> is currently <strong>on hold</strong>.
    </p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #92400e;">
        Current Status: On Hold
      </p>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">What This Means:</p>
      <ul style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">The company has not made a final decision yet</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">You may be in consideration as a backup candidate</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">The company might reach out if a position opens up</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Your application is being kept active for future rounds</li>
      </ul>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">What You Should Do:</p>
      <ol style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;"><strong>Stay Available:</strong> Keep your contact information updated</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;"><strong>Remain Prepared:</strong> Continue your preparation as if you're still in the process</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;"><strong>Explore Other Options:</strong> Continue applying to other drives</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;"><strong>Don't Wait:</strong> Treat this as neither acceptance nor rejection</li>
      </ol>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1e40af;">Our Advice:</p>
      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">
        While we understand this creates uncertainty, we recommend you continue participating in other placement drives actively. An "on hold" status should not prevent you from pursuing other opportunities.
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
      We'll keep you updated if there's any change in your application status.
    </p>
    
    ${getEmailFooter(variables)}
  `;
  
  return {
    subject: `Application Status: On Hold - ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

/**
 * New Placement Drive Published
 */
export function getNewDrivePublishedTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${variables.studentName}</strong>,
    </p>
    
    <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 24px;">🔔</p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #1e40af;">
        New Placement Opportunity Available!
      </p>
    </div>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      A new placement opportunity is now available on the portal!
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0;">
      <ul style="margin: 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Company:</strong> ${variables.companyName}</li>
        <li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Role:</strong> ${variables.roleName}</li>
        ${variables.ctc ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>CTC:</strong> ${variables.ctc}</li>` : ''}
        ${variables.location ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Location:</strong> ${variables.location}</li>` : ''}
        ${variables.deadline ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Application Deadline:</strong> ${variables.deadline}</li>` : ''}
        ${variables.driveDate ? `<li style="margin-bottom: 8px; font-size: 15px; color: #065f46;"><strong>Drive Date:</strong> ${variables.driveDate}</li>` : ''}
      </ul>
    </div>
    
    ${variables.additionalInfo ? `
    <div style="background-color: #f9fafb; border-left: 4px solid #9ca3af; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #374151;">About the Opportunity:</p>
      <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        ${variables.additionalInfo}
      </p>
    </div>
    ` : ''}
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">How to Apply:</p>
      <ol style="margin: 0; padding-left: 24px; color: #374151;">
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Log in to the placement portal</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Navigate to "Available Drives"</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Review the complete job description and eligibility criteria</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Ensure you meet all requirements</li>
        <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">Submit your application before the deadline</li>
      </ol>
    </div>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #991b1b;">Important Reminders:</p>
      <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">Apply only if you meet all eligibility criteria</li>
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">Applications received after the deadline will not be considered</li>
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">Ensure your profile is complete before applying</li>
        <li style="margin-bottom: 6px; font-size: 14px; line-height: 1.5;">Upload your latest resume</li>
      </ul>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; font-weight: 600; color: #111827; text-align: center;">
      Don't miss this opportunity! Apply today!
    </p>
    
    ${getEmailFooter(variables)}
  `;
  
  return {
    subject: `🔔 New Placement Drive: ${variables.companyName}`,
    body: wrapInHtmlTemplate(content),
  };
}

/**
 * Drive Reminder (Before Deadline)
 */
export function getDriveDeadlineReminderTemplate(variables: TemplateVariables): EmailTemplate {
  const content = `
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      Dear <strong>${variables.studentName}</strong>,
    </p>
    
    <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 32px;">⏰</p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #92400e;">
        Deadline Approaching Soon!
      </p>
    </div>
    
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
      This is a friendly reminder that the application deadline for <strong>${variables.companyName}</strong> is approaching soon.
    </p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #92400e;">Drive Details:</p>
      <ul style="margin: 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 8px; font-size: 15px; color: #92400e;"><strong>Company:</strong> ${variables.companyName}</li>
        <li style="margin-bottom: 8px; font-size: 15px; color: #92400e;"><strong>Role:</strong> ${variables.roleName}</li>
        ${variables.deadline ? `<li style="margin-bottom: 8px; font-size: 16px; font-weight: 700; color: #92400e;"><strong>⚠️ Deadline:</strong> ${variables.deadline}</li>` : ''}
      </ul>
    </div>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Haven't Applied Yet?</p>
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
        If you're interested and eligible, please submit your application before the deadline. Late applications will not be accepted.
      </p>
    </div>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #065f46;">Already Applied?</p>
      <p style="margin: 0; font-size: 14px; color: #065f46; line-height: 1.5;">
        Great! Please ignore this reminder and wait for further updates.
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 16px; font-weight: 600; color: #dc2626; text-align: center;">
      ⚠️ Time is running out – Apply now if you haven't already!
    </p>
    
    ${getEmailFooter(variables)}
  `;
  
  return {
    subject: `⏰ Reminder: Apply Soon - ${variables.companyName} (Deadline Approaching)`,
    body: wrapInHtmlTemplate(content),
  };
}

/**
 * Get template by event type
 */
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

/**
 * Map application status to email event
 */
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