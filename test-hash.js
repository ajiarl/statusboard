const bcrypt = require('bcryptjs');
const password = 'password';
const hash = process.argv[2];

bcrypt.compare(password, hash).then(result => {
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('Match:', result);
});
