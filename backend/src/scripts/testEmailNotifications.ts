/**
 * Test Email Notifications
 * 
 * Tests the complete email notification flow:
 * - Registration welcome email
 * - Application status change notifications
 * - New drive published notifications
 * 
 * Usage: npx ts-node src/scripts/testEmailNotifications.ts
 */

import { prisma } from '../config/db';
import { 
  notifyStudentRegistration, 
  notifyApplicationStatusChange,
  notifyNewDrivePublished,
  notifyProfileIncomplete,
  notifyApplicationSubmitted
} from '../services/notification.service';

async function testRegistrationEmail() {
  console.log('\n📧 Testing Registration Email...');
  
  // Find a student user
  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
  });
  
  if (!student) {
    console.log('❌ No student found. Create a student first.');
    return;
  }
  
  console.log(`Found student: ${student.name} (${student.email})`);
  
  try {
    await notifyStudentRegistration(student.id);
    console.log('✅ Registration email queued successfully');
  } catch (error) {
    console.error('❌ Failed to queue registration email:', error);
  }
}

async function testApplicationStatusEmail() {
  console.log('\n📧 Testing Application Status Change Email...');
  
  // Find an application
  const application = await prisma.application.findFirst({
    include: {
      student: true,
      company: true,
    },
  });
  
  if (!application) {
    console.log('❌ No application found. Create an application first.');
    return;
  }
  
  console.log(`Found application: ${application.student.name} -> ${application.company.name}`);
  console.log(`Current status: ${application.status}`);
  
  try {
    await notifyApplicationStatusChange(application.id);
    console.log('✅ Status change email queued successfully');
  } catch (error) {
    console.error('❌ Failed to queue status change email:', error);
  }
}

async function testNewDriveEmail() {
  console.log('\n📧 Testing New Drive Published Email...');
  
  // Find a company/drive
  const company = await prisma.company.findFirst({
    where: { status: 'OPEN' },
  });
  
  if (!company) {
    console.log('❌ No open drive found. Create a drive first.');
    return;
  }
  
  console.log(`Found drive: ${company.name} - ${company.roleOffered}`);
  
  // Get count of eligible students
  const studentCount = await prisma.user.count({
    where: { role: 'STUDENT', status: 'ACTIVE' },
  });
  
  console.log(`Will send to ${studentCount} active students`);
  
  try {
    await notifyNewDrivePublished(company.id);
    console.log('✅ New drive emails queued successfully');
  } catch (error) {
    console.error('❌ Failed to queue new drive emails:', error);
  }
}

async function testProfileIncompleteEmail() {
  console.log('\n📧 Testing Profile Incomplete Email...');
  
  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
  });
  
  if (!student) {
    console.log('❌ No student found.');
    return;
  }
  
  console.log(`Testing with: ${student.name} (${student.email})`);
  
  try {
    await notifyProfileIncomplete(
      student.id,
      student.name,
      ['Missing profile photo', 'Incomplete academic records', 'Resume not uploaded']
    );
    console.log('✅ Profile incomplete email queued successfully');
  } catch (error) {
    console.error('❌ Failed to queue profile incomplete email:', error);
  }
}

async function testApplicationSubmittedEmail() {
  console.log('\n📧 Testing Application Submitted Email...');
  
  const application = await prisma.application.findFirst({
    include: {
      student: true,
      company: true,
    },
  });
  
  if (!application) {
    console.log('❌ No application found.');
    return;
  }
  
  console.log(`Testing with: ${application.student.name} -> ${application.company.name}`);
  
  try {
    await notifyApplicationSubmitted(application.id);
    console.log('✅ Application submitted email queued successfully');
  } catch (error) {
    console.error('❌ Failed to queue application submitted email:', error);
  }
}

async function checkEmailSettings() {
  console.log('\n⚙️  Checking Email Configuration...');
  
  const settings = await prisma.systemSettings.findFirst();
  
  if (!settings) {
    console.log('❌ No system settings found. Configure settings first.');
    return false;
  }
  
  console.log('SMTP Configuration:');
  console.log(`  Host: ${settings.smtpHost || '❌ Not set'}`);
  console.log(`  Port: ${settings.smtpPort || '❌ Not set'}`);
  console.log(`  User: ${settings.smtpUser || '❌ Not set'}`);
  console.log(`  From: ${settings.emailFrom || settings.smtpUser || '❌ Not set'}`);
  console.log(`  From Name: ${settings.emailFromName || '❌ Not set'}`);
  
  console.log('\nNotification Settings:');
  console.log(`  Email Notifications: ${settings.emailNotifications ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Application Status: ${settings.notifyApplicationStatus ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  New Drive: ${settings.notifyNewDrive ? '✅ Enabled' : '❌ Disabled'}`);
  
  if (!settings.smtpHost || !settings.smtpUser) {
    console.log('\n❌ SMTP not configured. Emails will fail!');
    return false;
  }
  
  if (!settings.emailNotifications) {
    console.log('\n⚠️  Email notifications are disabled!');
    return false;
  }
  
  return true;
}

async function main() {
  console.log('='.repeat(60));
  console.log('📧 Email Notification Test Suite');
  console.log('='.repeat(60));
  
  // Check configuration first
  const isConfigured = await checkEmailSettings();
  
  if (!isConfigured) {
    console.log('\n⚠️  Fix configuration issues before testing emails.');
    process.exit(1);
  }
  
  // Get test type from command line
  const testType = process.argv[2];
  
  try {
    switch (testType) {
      case 'registration':
        await testRegistrationEmail();
        break;
      case 'status':
        await testApplicationStatusEmail();
        break;
      case 'drive':
        await testNewDriveEmail();
        break;
      case 'profile':
        await testProfileIncompleteEmail();
        break;
      case 'submitted':
        await testApplicationSubmittedEmail();
        break;
      case 'all':
        await testRegistrationEmail();
        await testProfileIncompleteEmail();
        await testApplicationSubmittedEmail();
        await testApplicationStatusEmail();
        await testNewDriveEmail();
        break;
      default:
        console.log('\nUsage: npx ts-node src/scripts/testEmailNotifications.ts <type>');
        console.log('\nAvailable types:');
        console.log('  registration  - Test registration welcome email');
        console.log('  status        - Test application status change email');
        console.log('  drive         - Test new drive published email');
        console.log('  profile       - Test profile incomplete email');
        console.log('  submitted     - Test application submitted email');
        console.log('  all           - Run all tests');
        process.exit(0);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed! Check your email queue and inbox.');
    console.log('💡 Tip: Make sure Redis and the email worker are running!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();