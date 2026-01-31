import { hashPassword, comparePassword } from '../utils/password';

async function main() {
  const testPassword = 'TestPassword123';
  
  console.log('Original password:', testPassword);
  console.log('Password length:', testPassword.length);
  console.log('Password bytes:', Buffer.from(testPassword).toString('hex'));
  
  // Hash the password
  const hash = await hashPassword(testPassword);
  console.log('\nHashed password:', hash);
  console.log('Hash length:', hash.length);
  
  // Test comparison
  const isValid = await comparePassword(testPassword, hash);
  console.log('\nPassword comparison result:', isValid);
  
  // Test with whitespace
  const withSpace = testPassword + ' ';
  const withSpaceValid = await comparePassword(withSpace, hash);
  console.log('With trailing space:', withSpaceValid);
  
  const leadingSpace = ' ' + testPassword;
  const leadingSpaceValid = await comparePassword(leadingSpace, hash);
  console.log('With leading space:', leadingSpaceValid);
}

main().catch(console.error);
