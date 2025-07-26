// scripts/hash-password.js
// Run with: node scripts/hash-password.js
const bcrypt = require('bcryptjs');

async function hashPassword() {
    const password = '@Aaditya12..'; // Your admin password
    const saltRounds = 12;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Password hash:');
        console.log(hash);
        console.log('\nAdd this to your .env.local file:');
        console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

hashPassword();