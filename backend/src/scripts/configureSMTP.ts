/**
 * Configure SMTP Settings
 * 
 * Sets up email configuration in the database
 * 
 * Usage: npx ts-node src/scripts/configureSMTP.ts
 */

import { prisma } from '../config/db';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function configureSMTP() {
  console.log('='.repeat(60));
  console.log('📧 SMTP Configuration Setup');
  console.log('='.repeat(60));
  console.log('\nFor Gmail:');
  console.log('  1. Go to: https://myaccount.google.com/apppasswords');
  console.log('  2. Create an App Password for "Mail"');
  console.log('  3. Use that password (not your regular Gmail password)');
  console.log('');
  console.log('Common SMTP Settings:');
  console.log('  Gmail: smtp.gmail.com:587 (use App Password)');
  console.log('  Outlook: smtp-mail.outlook.com:587');
  console.log('  Yahoo: smtp.mail.yahoo.com:587');
  console.log('  Mailtrap (testing): smtp.mailtrap.io:2525');
  console.log('='.repeat(60));
  console.log('');

  try {
    const smtpHost = await question('SMTP Host (e.g., smtp.gmail.com): ');
    const smtpPortStr = await question('SMTP Port (default: 587): ');
    const smtpPort = smtpPortStr ? parseInt(smtpPortStr) : 587;
    const smtpSecureStr = await question('Use TLS/SSL? (yes/no, default: no): ');
    const smtpSecure = smtpSecureStr.toLowerCase() === 'yes';
    const smtpUser = await question('SMTP Username (email): ');
    const smtpPassword = await question('SMTP Password (or App Password): ');
    
    const emailFrom = await question(`From Email (default: ${smtpUser}): `) || smtpUser;
    const emailFromName = await question('From Name (default: Placement Cell): ') || 'Placement Cell';
    
    const institutionName = await question('Institution Name (default: Institution): ') || 'Institution';
    const contactEmail = await question(`Contact Email (default: ${smtpUser}): `) || smtpUser;
    const contactPhone = await question('Contact Phone (optional): ') || undefined;

    console.log('\n' + '='.repeat(60));
    console.log('Review Configuration:');
    console.log('='.repeat(60));
    console.log(`SMTP Host: ${smtpHost}`);
    console.log(`SMTP Port: ${smtpPort}`);
    console.log(`SMTP Secure: ${smtpSecure}`);
    console.log(`SMTP User: ${smtpUser}`);
    console.log(`SMTP Password: ${'*'.repeat(smtpPassword.length)}`);
    console.log(`From Email: ${emailFrom}`);
    console.log(`From Name: ${emailFromName}`);
    console.log(`Institution: ${institutionName}`);
    console.log(`Contact Email: ${contactEmail}`);
    console.log(`Contact Phone: ${contactPhone || 'Not set'}`);
    console.log('='.repeat(60));

    const confirm = await question('\nSave this configuration? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Configuration cancelled.');
      return;
    }

    console.log('\n💾 Saving configuration...');
    
    const existingSettings = await prisma.systemSettings.findFirst();
    
    if (existingSettings) {
      await prisma.systemSettings.update({
        where: { id: existingSettings.id },
        data: {
          smtpHost,
          smtpPort,
          smtpSecure,
          smtpUser,
          smtpPassword,
          emailFrom,
          emailFromName,
          institutionName,
          contactEmail,
          contactPhone,
          emailNotifications: true,
          notifyApplicationStatus: true,
          notifyNewDrive: true,
        },
      });
      console.log('✅ SMTP configuration updated successfully!');
    } else {
      await prisma.systemSettings.create({
        data: {
          smtpHost,
          smtpPort,
          smtpSecure,
          smtpUser,
          smtpPassword,
          emailFrom,
          emailFromName,
          institutionName,
          contactEmail,
          contactPhone,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: false,
          notifyApplicationStatus: true,
          notifyNewDrive: true,
        },
      });
      console.log('✅ SMTP configuration created successfully!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Configuration Complete!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('  1. Test the configuration:');
    console.log('     npx ts-node src/scripts/testEmailNotifications.ts registration');
    console.log('');
    console.log('  2. Check email worker logs in your backend terminal');
    console.log('');
    console.log('  3. Verify emails are being sent');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

configureSMTP();