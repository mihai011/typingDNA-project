const { createHash } = require('crypto');
// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var checks = require('./check_pattern.js');

var patterns = {};


server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;

io.on('connection', (socket) => {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    data.pattern;

    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data.message
    });

    checks.check_patterns(socket, data.pattern, patterns);

  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (data) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = data.username;
    socket.pattern = data.pattern;
    ++numUsers;
    addedUser = true;
    if (socket.pattern != undefined){
      patterns[socket.username] = socket.pattern
    }
    socket.emit('login', {
      numUsers: numUsers, 
      username:socket.username
    });
    // echo globally (all clients) that a person has connected
    io.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;
      delete patterns[socket.username];


      // echo globally that this client has left
      io.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
      });
    }
  });
});
