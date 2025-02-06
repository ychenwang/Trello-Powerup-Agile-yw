import mysql from 'mysql2/promise';

async function CreateDB(connection) {
    try {
      await connection.execute(
        `CREATE TABLE IF NOT EXISTS user (
          user_id DECIMAL(10) NOT NULL AUTO_INCREMENT,
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
          user_id DECIMAL(10) NOT NULL,
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
  