$(function () {
  var COLORS = [
    "#e21400",
    "#91580f",
    "#f8a700",
    "#f78b00",
    "#58dc00",
    "#287b00",
    "#a8f07a",
    "#4ae8c4",
    "#3b88eb",
    "#3824aa",
    "#a700ff",
    "#d300e7",
    "#F0330B",
    "#A569BD",
    "#28B463",
    "#28B463",
    "#5DADE2",
    "#5DADE2",
    "#2C3E50",
    "#641E16",
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $(".usernameInput"); // Input for username
  var $messages = $(".messages"); // Messages area
  var $inputMessage = $(".inputMessage"); // Input message input box
  var $inputText = $(".inputText"); //Input text for input box
  var $scoreTable = $(".scoreTable"); // shows the curreent score with the rest of the players
  var $wl = $(".winorloss"); //message for winner, loser or just info

  var $loginPage = $(".login.page"); // The login page
  var $chatPage = $(".chat.page"); // The chatroom page

  // Prompt for setting a username
  var username;
  var patternText;
  var connected = false;
  $usernameInput.focus();
  var socket = io();

  var tdna = new TypingDNA();
  var patternObject;

  tdna.addTarget("pattern_message");
  tdna.addTarget("pattern_text");

  const addParticipantsMessage = (data) => {
    var message = "";
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }

    log(message);
  };

  // Sets the client's username
  const setUsernameAndPattern = () => {
    username = cleanInput($usernameInput.val().trim());
    patternText = cleanInput($inputText.val());
    // If the username is valid
    if (username && patternText) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off("click");
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit("add user", { username: username, pattern: patternObject });
    }
  };

  // Sends a chat message
  const sendMessage = () => {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val("");
      addChatMessage({
        username: username,
        message: message,
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit("new message", { message: message, pattern: patternObject });
    }
  };

  // Log a message
  const log = (message, options) => {
    var $el = $("<li>").addClass("log").text(message);
    addMessageElement($el, options);
  };

  // Adds the visual chat message to the message list
  const addChatMessage = (data, options) => {
    // Don't fade the message in if there is an 'X was typing'
    // var $typingMessages = getTypingMessages(data);
    // options = options || {};
    // if ($typingMessages.length !== 0) {
    //   options.fade = false;
    //   $typingMessages.remove();
    // }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css("color", getUsernameColor(data.username));

    var $messageBodyDiv = $('<span class="messageBody">').text(data.message);

    var typingClass = data.typing ? "typing" : "";
    var $messageDiv = $('<li class="message"/>')
      .data("username", data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  };

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  const addMessageElement = (el, options) => {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === "undefined") {
      options.fade = true;
    }
    if (typeof options.prepend === "undefined") {
      options.prepend = true;
    }

    // Apply options
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  };

  // Prevents input from having injected markup
  const cleanInput = (input) => {
    return $("<div/>").text(input).html();
  };

  // Gets the color of a username through our hash function
  const getUsernameColor = (username) => {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  };

  //full reset function in case of win,loss or diconnection
  const fullReset = () => {
    $loginPage.show();
    $chatPage.fadeOut();
    $usernameInput.focus();
    username = "";
    patternText = "";
    tdna.reset();
    $inputText.val("");
  };

  // Keyboard events

  $window.keydown((event) => {
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username && patternText) {
        patternObject = tdna.getTypingPattern({
          type: 0,
          targetId: "pattern_message",
        });
        sendMessage();
        tdna.reset();
        socket.emit("stop typing");
        typing = false;
      } else {
        if ($usernameInput.val() != "") {
          $inputText.focus();
        } else {
          $usernameInput.focus();
        }
        if ($usernameInput.val() != "" && $inputText.val() != "") {
          patternObject = tdna.getTypingPattern({
            type: 0,
            targetId: "pattern_text",
          });
          setUsernameAndPattern();
        }
        tdna.reset();
      }
    }
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(() => {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on("login", (data) => {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Typing DNA Game – threshold is " + data.THRESHOLD;
    log(message, {
      prepend: false,
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on("new message", (data) => {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on("user joined", (data) => {
    log(data.username + " joined");
    addParticipantsMessage(data);
    console.log(data.users);
  });

  socket.on("elimination", (data) => {
    if (data.loser === username) {
      $wl.text("You lost! " + data.winner + " eliminated you!");
      socket.emit("delete pattern", { user: username });
      fullReset();
    } else {
      if (data.winner === username) {
        $(".scoreTable " + "#" + data.encoded).remove();
        log(data.loser + " is eliminated by you!");
      } else {
        $(".scoreTable " + "#" + data.encoded).remove();
        log(data.loser + " is eliminated by " + data.winner + "!");
      }
    }
  });

  socket.on("winner", (data) => {
    if (data.winner === username) {
      $wl.text("You won!");
    }
    fullReset();
  });

  socket.on("update score", (data) => {
    if ($(".scoreTable " + "#" + data.encoded).length) {
      $(".scoreTable " + "#" + data.encoded).text(data.user + " " + data.score);
    } else {
      $scoreTable.append("<li id=" + data.encoded + " ></li>");
      $(".scoreTable " + "#" + data.encoded)
        .text(data.user + " " + data.score)
        .css("color", getUsernameColor(data.user));
    }
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on("user left", (data) => {
    log(data.username + " left");
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // when the user disconnected reset page with message
  socket.on("disconnect", () => {
    log("you have been disconnected");
    fullReset();
    $wl.text("Oops! looks like you have been disconnected!");
  });
});
