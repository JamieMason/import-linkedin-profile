var http = require('http');
var parseUri = require('url').parse;
var linkedIn = require('../index');
var apiKeys = require('../api-keys.json');
var port = 3000;
var jsonPath = '/profile.json';
var tunnelUri;

// start up a server on your local machine
http.createServer(function(req, res) {

  var uri = parseUri(req.url, true);

  if (uri.pathname === '/') {

    // expose this server over the internet, so LinkedIn can reach it
    linkedIn.tunnel.open(port).then(function(tunnelLocation) {

      var authUrl;

      // keep the tunnel uri, LinkedIn asks that it matches across every request
      tunnelUri = 'http://' + tunnelLocation.hostname;

      // generate the uri to visit at LinkedIn to login and authorise our app
      authUrl = linkedIn.getUserLoginUri({
        apiKey: apiKeys.apiKey,
        salt: apiKeys.salt,
        redirectUri: tunnelUri + jsonPath
      }).toString();

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<a href="' + authUrl + '">Login And Authorise App</a>');

    });

  }

  // LinkedIn will redirect us back here
  else if (uri.pathname === jsonPath) {

    // exchange the auth code we were passed as a GET param for an access token
    linkedIn.getAccessToken({
      authCode: uri.query.code,
      secretKey: apiKeys.secretKey,
      apiKey: apiKeys.apiKey,
      redirectUri: tunnelUri + jsonPath
    }).then(function (accessToken) {

      // use the access token to get our profile JSON
      linkedIn.getProfile(accessToken).then(function(profileData) {

        // in this example we'll serve out that JSON
        res.writeHead(200, { 'Content-Type': 'text/json' });
        res.end(JSON.stringify(profileData));

      }).fail(function (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to get profile');
      });

    }).fail(function (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Failed to get access token');
    });
  }

  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('\n');
  }

}).listen(port);

console.log('Server listening on port ' + port);