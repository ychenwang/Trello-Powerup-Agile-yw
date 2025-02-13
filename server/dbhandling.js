
import dotenv from 'dotenv';
import express from 'express';
import { createConnection } from 'mysql2/promise';
import { json } from 'body-parser';

dotenv.config();

const app = express();
app.use(json());

app.post('/api/query', async (req, res) => {
  // DB configs taken from the input.
  const { host, port, username, password } = req.body;

  if (!host || !port || !username || !password) {
    return res.status(400).json({ error: 'Missing required DB configuration.' });
  }

  // Create a connection configuration.
  const connectionConfig = {
    host: host,
    port: port,
    user: username,
    password: password,
    ssl: { rejectUnauthorized: false }
  };

  try {
    // Connect to the MySQL database using the provided configuration.
    // For simplicity, just try to creat the tables every time.
    const connection = await createConnection(connectionConfig);
    await CreateDB(connection);
    res.json({ message: 'Database connection succesful.' });
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
    res.status(500).json({ error: 'Failed to connect to the database.' });
  }
});

const port = process.env.PORT || 3000;
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
        list_id VARCHAR(255) NOT NULL,
        list_name VARCHAR(255) NOT NULL,
        PRIMARY KEY (list_id)
      );`
    );
    console.log('Table "list" created or already exists.');

    await connection.execute(
      `CREATE TABLE IF NOT EXISTS card (
        card_id VARCHAR(255) NOT NULL,
        card_name VARCHAR(255) NOT NULL,
        created_date DATETIME NOT NULL,
        due_date DATETIME,
        estimation DECIMAL(10),
        PRIMARY KEY (card_id)
      );`
    );
    console.log('Table "card" created or already exists.');

    await connection.execute(
      `CREATE TABLE IF NOT EXISTS action (
        action_id VARCHAR(255) NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        action_type VARCHAR(255),
        action_date DATETIME,
        old_list_id VARCHAR(255),
        new_list_id VARCHAR(255),
        PRIMARY KEY (action_id),
        FOREIGN KEY (card_id) REFERENCES card(card_id),
        FOREIGN KEY (old_list_id) REFERENCES list(list_id) ON DELETE CASCADE,
        FOREIGN KEY (new_list_id) REFERENCES list(list_id) ON DELETE CASCADE
      );`
    );
    console.log('Table "action" created or already exists.');

    await connection.execute(
      `CREATE TABLE IF NOT EXISTS comment (
        comment_id VARCHAR(255) NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        comment_date DATETIME NOT NULL,
        PRIMARY KEY (comment_id),
        FOREIGN KEY (card_id) REFERENCES card(card_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
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

// NOTE: Where the function takes a list as parameter
// it is generally best to get the list items from the trello Rest API
// as the powerup functions are limited

/**
 * Writes a list of trello members to the DB
 * @param connection A DB connection
 * @param members A list of trello board members
 */
export async function WriteUsers(connection, users) {
  if (!Array.isArray(users)) {
    console.error("WriteUsers expected an array of users");
    return;
  }

  try {
    await connection.query(
      `INSERT INTO user (user_id)
        VALUES ?
        ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
      [users.map(user => [user.id])]
    );

    console.log(`Synced ${users.length} users`);
  } catch (err) {
    console.error("Error inserting users", err);
  }
}

/**
 * Writes a list of trello lists to the DB
 * @param connection 
 * @param lists 
 */
export async function WriteLists(connection, lists) {
  if (!Array.isArray(lists)) {
    console.error("WriteLists expected an array of lists");
    return;
  }

  try {
    await connection.query(
      `INSERT INTO list (list_id, list_name)
       VALUES ?
       ON DUPLICATE KEY UPDATE list_name = VALUES(list_name)`,
      [lists.map(list => [list.id, list.name])]
    );
    
    console.log(`Synced ${lists.length} lists`);
  } catch (error) {
    console.error('Error writing lists:', error);
    throw error;
  }
}

/**
 * Writes a list of trello cards to the DB
 * Cards to note have a closed date so those need to be calculated by the client
 * Estimation is a custom field from the powerup
 * @param connection 
 * @param cards 
 */
export async function WriteCards(connection, cards) {
  if (!Array.isArray(cards)) {
    console.error("WriteCards expected an array of cards");
    return;
  }

  try {
    await connection.query(
      `INSERT INTO card (card_id, card_name, created_date, due_date, estimation)
       VALUES ?
       ON DUPLICATE KEY UPDATE 
         card_name = VALUES(card_name),
         due_date = VALUES(due_date),
         estimation = VALUES(estimation)`,
      [cards.map(card => [
        card.id,
        card.name,
        new Date(card.start).toISOString().slice(0, 19).replace('T', ' '),
        card.due ? new Date(card.due).toISOString().slice(0, 19).replace('T', ' ') : null,
        card.estimation
      ])]
    );
    
    console.log(`Synced ${cards.length} cards`);
  } catch (error) {
    console.error('Error writing cards:', error);
    throw error;
  }
}

/**
 * Write a list of actions to the DB
 * Trello does not support a list of actions with all the fields we want
 * the actions need to be custom built
 * Each action should have a card_id, and optionally both new and old list ids.
 * @param connection 
 * @param actions 
 */
export async function WriteActions(connection, actions) {
  if (!Array.isArray(actions)) {
    console.error("WriteActions expected an array of actions");
    return;
  }

  try {
    await connection.query(
      `INSERT INTO action (action_id, card_id, user_id, action_type, action_date, old_list_id, new_list_id)
       VALUES ?
       ON DUPLICATE KEY UPDATE 
         action_type = VALUES(action_type),
         action_date = VALUES(action_date)`,
      [actions.map(a => [
        a.action_id, a.card_id, a.user_id, a.type, 
        a.action_date.toISOString().slice(0, 19).replace('T', ' '), 
        a.old_list_id, a.new_list_id])]
    );
    
    console.log(`Synced ${actions.length} actions`);
  } catch (error) {
    console.error('Error writing actions:', error);
    throw error;
  }
}

/**
 * Write a list of comments to the DB
 * Trello does not support a list of all comments (they're a special type of action) 
 * so this needs to be extracted and built manually
 * The DB does not store the actual text.
 * @param connection 
 * @param comments 
 */
export async function WriteComments(connection, comments) {
  if (!Array.isArray(comments)) {
    console.error("WriteComments expected an array of comments");
    return;
  }

  try {
    await connection.query(
      `INSERT INTO comment (comment_id, card_id, user_id, comment_date)
       VALUES ?
       ON DUPLICATE KEY UPDATE 
         comment_date = VALUES(comment_date)`,
      [comments.map(c => [c.comment_id, c.card_id, c.user_id, 
        c.comment_date.toISOString().slice(0, 19).replace('T', ' ')])]
    );
    
    console.log(`Synced ${comments.length} comments`);
  } catch (error) {
    console.error('Error writing comments:', error);
    throw error;
  }
}

export async function ReadUsers(connection) {
  try {
    const [rows] = await connection.query("SELECT * FROM user");
    console.log(`Retrieved ${rows.length} users`);
    return rows;
  } catch (error) {
    console.error("Error reading users:", error);
    throw error;
  }
}

export async function ReadLists(connection) {
  try {
    const [rows] = await connection.query("SELECT * FROM list");
    console.log(`Retrieved ${rows.length} lists`);
    return rows;
  } catch (error) {
    console.error("Error reading lists:", error);
    throw error;
  }
}

export async function ReadCards(connection) {
  try {
    const [rows] = await connection.query("SELECT * FROM card");
    console.log(`Retrieved ${rows.length} cards`);
    return rows;
  } catch (error) {
    console.error("Error reading cards:", error);
    throw error;
  }
}

export async function ReadActions(connection) {
  try {
    const [rows] = await connection.query("SELECT * FROM action");
    console.log(`Retrieved ${rows.length} actions`);
    return rows;
  } catch (error) {
    console.error("Error reading actions:", error);
    throw error;
  }
}

export async function ReadComments(connection) {
  try {
    const [rows] = await connection.query("SELECT * FROM comment");
    console.log(`Retrieved ${rows.length} comments`);
    return rows;
  } catch (error) {
    console.error("Error reading comments:", error);
    throw error;
  }
}
