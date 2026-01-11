const { hash } = require('bcryptjs');

async function generateHash() {
  const password = 'password123';
  const hashedPassword = await hash(password, 10);
  console.log('Hashed password for "password123":');
  console.log(hashedPassword);
}

generateHash();
