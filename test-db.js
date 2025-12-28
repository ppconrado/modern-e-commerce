const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'ecommerce_db',
  user: 'postgres',
  password: 'postgres123',
});

client
  .connect()
  .then(() => {
    console.log('✓ Connected to PostgreSQL successfully!');
    return client.query('SELECT version()');
  })
  .then((res) => {
    console.log('PostgreSQL version:', res.rows[0].version);
    return client.end();
  })
  .then(() => {
    console.log('✓ Connection closed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('✗ Connection failed:', err.message);
    process.exit(1);
  });
