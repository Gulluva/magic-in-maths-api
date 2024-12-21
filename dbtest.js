const { Client } = require('pg');

// Connection configuration
const config = {
  user: 'postgres',
  password: '5G6h7j8k9l',
  host: 'localhost',
  port: 5432,
  database: 'maths_in_magic'
};

async function listDatabases(client) {
  const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
  console.log('Databases:');
  res.rows.forEach(row => console.log(row.datname));
}

async function listTables(client) {
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('Tables in current database:');
  res.rows.forEach(row => console.log(row.table_name));
}

async function runTests() {
  const client = new Client(config);

  try {
    // 3. Connect to the database
    await client.connect();
    console.log('Connected to PostgreSQL');

    // List all databases
    await listDatabases(client);

    // List all tables in the current database
    await listTables(client);

    // 4. Execute a simple query to test read operations
    const res = await client.query('SELECT current_date');
    console.log('Current date:', res.rows[0].current_date);

    // 5. Perform a basic write operation
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query("INSERT INTO test_table (name) VALUES ($1)", ['Test Entry']);
    console.log('Inserted a test entry');

    // 6. Verify that the data was successfully written
    const verifyRes = await client.query('SELECT * FROM prime_colour_spheres');
    console.log('Retrieved test data:', verifyRes.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
    console.log('Disconnected from PostgreSQL');
  }
}

runTests();