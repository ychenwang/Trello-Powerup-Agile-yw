
var t = TrelloPowerUp.iframe();

document.addEventListener('DOMContentLoaded', function() {
  var configForm = document.getElementById('dbForm');
  var messageDiv = document.getElementById('message');

  // Prepopulate the form if a configuration already exists.
  t.get('board', 'private', 'dbConfig')
  .then(function(dbConfig) {
    if (dbConfig) {
      document.getElementById('host').value = dbConfig.host || '';
      document.getElementById('port').value = dbConfig.port || '';
      document.getElementById('username').value = dbConfig.username || '';
      document.getElementById('password').value = dbConfig.password || '';
      document.getElementById('database').value = dbConfig.database || '';
    }
  })
  .catch(function(error) {
  console.error('Error retrieving database config:', error);
  });

  // When the form is submitted, save the DB configuration.
  configForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var dbConfig = {
      host: document.getElementById('host').value,
      port: document.getElementById('port').value,
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
      database: document.getElementById('database').value
    };

    t.set('board', 'private', 'dbConfig', dbConfig)
    .then(function() {
      messageDiv.textContent = 'Database configuration saved successfully!';
    })
    .catch(function(error) {
      console.error('Error saving database config:', error);
      messageDiv.textContent = 'Error saving configuration.';
    });
  });
});