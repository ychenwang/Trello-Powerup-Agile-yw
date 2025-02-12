
import dotenv from 'dotenv';
import express from 'express';
import { createConnection } from 'mysql2/promise';
import { json } from 'body-parser';

dotenv.config();

const app = express();
app.use(json());

app.post('/api/query', async (req, res) => {
  // DB configs taken from the input.
  const { host, port, login, password } = req.body;

  if (!host || !port || !login || !password) {
    return res.status(400).json({ error: 'Missing required DB configuration.' });
  }

  // Create a connection configuration.
  const connectionConfig = {
    host: host,
    port: port,
    login: login,
    password: password,
    ssl: { rejectUnauthorized: false }
  };

  try {
    // Connect to the MySQL database using the provided configuration.
    // For simplicity, just try to creat the tables every time.
    const connection = await createConnection(connectionConfig);
    CreateDB(connection);
    res.json({ message: 'Database connection succesful.' });
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
    res.status(500).json({ error: 'Failed to connect to the database.' });
  }
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});


async function CreateDB(connection) {
  try {
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS user (
        user_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (user_id)
      );`
    );
    console.log('Table "user" created or already exists.');

    await connection.execute(
      `CREATE TABLE IF NOT EXISTS list (
        list_id DECIMAL(10) NOT NULL,
        list_name VARCHAR(255) NOT NULL,
        PRIMARY KEY (list_id)
      );`
    );
    console.log('Table "list" created or already exists.');

    await connection.execute(
      `CREATE TABLE IF NOT EXISTS card (
        card_id DECIMAL(10) NOT NULL,
        card_name VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL,
        due_date DATETIME,
        completed_at DATETIME,
        estimation DECIMAL(10),
        PRIMARY KEY (card_id)
      );`
    );
    console.log('Table "card" created or already exists.');

    await connection.execute(
      `CREATE TABLE IF NOT EXISTS action (
        action_id DECIMAL(10) NOT NULL,
        card_id DECIMAL(10) NOT NULL,
        old_list_id DECIMAL(10) NOT NULL,
        new_list_id DECIMAL(10) NOT NULL,
        PRIMARY KEY (action_id),
        FOREIGN KEY (card_id) REFERENCES card(card_id),
        FOREIGN KEY (old_list_id) REFERENCES list(list_id),
        FOREIGN KEY (new_list_id) REFERENCES list(list_id)
      );`
    );
    console.log('Table "action" created or already exists.');

    await connection.execute(
      `CREATE TABLE IF NOT EXISTS comment (
        comment_id DECIMAL(10) NOT NULL,
        card_id DECIMAL(10) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        comment_time DATETIME NOT NULL,
        PRIMARY KEY (comment_id),
        FOREIGN KEY (card_id) REFERENCES card(card_id),
        FOREIGN KEY (user_id) REFERENCES user(user_id)
      );`
    );
    console.log('Table "comment" created or already exists.');

  } catch (err) {
    console.error('Error executing queries:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

async function WriteUsers() {
  
}

exports.ConnectDB = ConnectDB;
