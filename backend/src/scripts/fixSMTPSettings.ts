/**
 * Fix SMTP Settings for Gmail
 * Updates SMTP configuration to work with Gmail
 */

import { prisma } from '../config/db';

async function fixSMTPSettings() {
  console.log('🔧 Fixing SMTP Settings for Gmail...\n');
  
  const settings = await prisma.systemSettings.findFirst();
  
  if (!settings) {
    console.log('❌ No settings found. Run configureSMTP.ts first.');
    return;
  }

  console.log('Current settings:');
  console.log(`  Host: ${settings.smtpHost}`);
  console.log(`  Port: ${settings.smtpPort}`);
  console.log(`  Secure: ${settings.smtpSecure}`);
  console.log(`  User: ${settings.smtpUser}`);

  // Fix settings for Gmail
  await prisma.systemSettings.update({
    where: { id: settings.id },
    data: {
      smtpPort: 587,
      smtpSecure: false, // Important: false for port 587
    },
  });

  console.log('\n✅ SMTP settings updated:');
  console.log('  Port: 587');
  console.log('  Secure: false (using STARTTLS)');
  console.log('\n🎉 Gmail SMTP should work now!');
  console.log('\nTest with:');
  console.log('  npx ts-node src/scripts/testEmailNotifications.ts registration');

  await prisma.$disconnect();
}

fixSMTPSettings();