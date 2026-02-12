import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import * as fs from 'fs';
import * as path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function testCloudinaryConnection() {
  console.log('\n🔍 Testing Cloudinary Connection...\n');
  
  // 1. Check configuration
  console.log('📋 Cloudinary Configuration:');
  console.log(`   Cloud Name: ${env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`   API Key: ${env.CLOUDINARY_API_KEY}`);
  console.log(`   API Secret: ${env.CLOUDINARY_API_SECRET ? '***configured***' : 'MISSING'}`);
  console.log();

  // 2. Test API connection by pinging
  try {
    console.log('🔌 Testing API connection...');
    const result = await cloudinary.api.ping();
    console.log('✅ API Connection successful!');
    console.log('   Response:', result);
    console.log();
  } catch (error: any) {
    console.error('❌ API Connection failed!');
    console.error('   Error:', error.message);
    console.error('   Status:', error.http_code);
    console.log('\n💡 Possible issues:');
    console.log('   1. Check your CLOUDINARY_CLOUD_NAME is correct');
    console.log('   2. Check your CLOUDINARY_API_KEY is correct');
    console.log('   3. Check your CLOUDINARY_API_SECRET is correct');
    console.log('   4. Verify you have internet connection');
    console.log();
    process.exit(1);
  }

  // 3. Create a test PDF buffer
  console.log('📄 Creating test PDF...');
  const testPdfBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000315 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n407\n%%EOF'
  );
  console.log(`✅ Test PDF created (${testPdfBuffer.length} bytes)`);
  console.log();

  // 4. Test upload
  console.log('📤 Testing file upload...');
  const testPublicId = 'cpms/TEST123_resume';
  
  try {
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: testPublicId,
          unique_filename: false,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(testPdfBuffer);
    });

    console.log('✅ Upload successful!');
    console.log(`   Public ID: ${uploadResult.public_id}`);
    console.log(`   Secure URL: ${uploadResult.secure_url}`);
    console.log();

    // 5. Test URL generation
    console.log('🔗 Testing URL generation...');
    
    // Import the URL generation function
    const { generatePreviewUrl } = await import('../services/cloudinary.service');
    
    const previewUrl = generatePreviewUrl(testPublicId);
    console.log('✅ Preview URL generated:');
    console.log(`   ${previewUrl}`);
    console.log('   This URL should display PDF inline in browser');
    console.log();

    const downloadUrl = previewUrl;
    console.log('✅ Download URL generated:');
    console.log(`   ${downloadUrl}`);
    console.log('   This URL should force download with filename');
    console.log();

    // 6. Clean up test file
    console.log('🧹 Cleaning up test file...');
    await cloudinary.uploader.destroy(testPublicId, { resource_type: 'raw' });
    console.log('✅ Test file deleted');
    console.log();

    console.log('🎉 All Cloudinary tests passed successfully!');
    console.log();
    console.log('✅ Your Cloudinary setup is working correctly.');
    console.log('   You can now upload resume and marksheet files.');
    console.log();

  } catch (error: any) {
    console.error('❌ Upload test failed!');
    console.error('   Error:', error.message);
    console.error('   Details:', error);
    console.log();
    console.log('💡 Possible issues:');
    console.log('   1. Check your Cloudinary credentials');
    console.log('   2. Verify your account has upload permissions');
    console.log('   3. Check if your account storage quota is exceeded');
    process.exit(1);
  }
}

// Run the test
testCloudinaryConnection()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
