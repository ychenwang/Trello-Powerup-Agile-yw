
require('dotenv').config();
import express from 'express';
import { createConnection } from 'mysql2/promise';
import { json } from 'body-parser';

const app = express();
app.use(json());

app.post('/api/query', async (req, res) => {
  const { host, port, username, password, database } = req.body;

  if (!host || !port || !username || !password || !database) {
    return res.status(400).json({ error: 'Missing required DB configuration.' });
  }

  // Create a connection configuration.
  const connectionConfig = {
    host: host,
    port: port,
    user: username,
    password: password,
    database: database,
    ssl: { rejectUnauthorized: true }
  };

  try {
    // Connect to the MySQL database using the provided configuration.
    const connection = await createConnection(connectionConfig);
    CreateDB(connection);
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
    res.status(500).json({ error: 'Failed to connect to the database.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});