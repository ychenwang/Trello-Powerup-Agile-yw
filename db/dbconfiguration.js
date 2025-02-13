
var t = TrelloPowerUp.iframe();

document.addEventListener('DOMContentLoaded', function() {
  var configForm = document.getElementById('dbForm');
  var messageDiv = document.getElementById('message');

  // Prepopulate the form if a configuration already exists.
  t.get('board', 'private', 'dbConfig')
  .then(function(dbConfig) {
    if (dbConfig) {
      document.getElementById('dbHost').value = dbConfig.host || '';
      document.getElementById('dbPort').value = dbConfig.port || '';
      document.getElementById('dbLogin').value = dbConfig.username || '';
      document.getElementById('dbPass').value = dbConfig.password || '';
    }
  })
  .catch(function(error) {
  console.error('Error retrieving database config:', error);
  });

  // When the form is submitted, save the DB configuration.
  configForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var dbConfig = {
      host: document.getElementById('dbHost').value,
      port: document.getElementById('dbPort').value,
      username: document.getElementById('dbLogin').value,
      password: document.getElementById('dbPass').value,
    };

    t.set('board', 'private', 'dbConfig', dbConfig)
    .then(function() {
      messageDiv.textContent = 'Configuration saved. Sending config to server...';

      // Send the configuration to the server
      return fetch('cs663-trellotest-ajepa3hgdhdkd9a5.canadacentral-01.azurewebsites.net/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dbConfig)
      });
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      messageDiv.textContent = 'Server response: ' + JSON.stringify(data);
    })
    .catch(function(error) {
      console.error('Error processing configuration:', error);
      messageDiv.textContent = 'Error processing configuration.';
    });
});
});