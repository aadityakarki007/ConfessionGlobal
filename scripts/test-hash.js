// scripts/test-hash.js
// Run with: node scripts/test-hash.js
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function testHash() {
    const password = '@Aaditya12..';
    const hash = '$2a$12$D.d/H5ShPwGubEjawfoJGOPjNRTZN3E4RrWuPMc7FzdgYa5iWu/56';
    
    console.log('=== HASH TEST ===');
    console.log('Testing password:', JSON.stringify(password));
    console.log('Password length:', password.length);
    console.log('Hash:', hash);
    console.log('Hash length:', hash.length);
    
    try {
        const isValid = await bcrypt.compare(password, hash);
        console.log('Is valid:', isValid ? '✅ YES' : '❌ NO');
        
        if (!isValid) {
            console.log('\n🔍 Let\'s try different variations:');
            
            // Test different possible passwords
            const variations = [
                '@Aaditya12..',
                '@Aaditya12.',
                'Aaditya12',
                '@aaditya12..',
                '@Aaditya12',
            ];
            
            for (const variant of variations) {
                const result = await bcrypt.compare(variant, hash);
                console.log(`"${variant}" ->`, result ? '✅' : '❌');
            }
        }
        
        // Also test environment variables
        console.log('\n=== ENV VARIABLES ===');
        console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME || 'NOT SET');
        console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD || 'NOT SET');
        console.log('ADMIN_PASSWORD_HASH exists:', !!process.env.ADMIN_PASSWORD_HASH);
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
        
    } catch (error) {
        console.error('Error testing hash:', error);
    }
}

testHash();