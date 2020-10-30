var https = require("https");
var querystring = require("querystring");
var base_url = "api.typingdna.com";

var apiKey = process.env.APIKEY;
var apiSecret = process.env.APISECRET;
var quality = parseInt(process.env.QUALITY);

function check_patterns(io, socket, message_pattern, users) {
  Object.keys(users).forEach((user) => {
    if (user != socket.username) {
      var id = users[user]["hash"];
      var encoded = users[user]["encoded"];
      var data = {
        tp: message_pattern,
        quality: quality,
      };

      var options = {
        hostname: base_url,
        port: 443,
        path: "/verify/" + id,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache",
          Authorization:
            "Basic " + new Buffer(apiKey + ":" + apiSecret).toString("base64"),
        },
      };

      var responseData = "";
      var req = https.request(options, function (res) {
        res.on("data", function (chunk) {
          responseData += chunk;
        });

        res.on("end", function () {
          responseData = JSON.parse(responseData);
          console.log(responseData);
          if (responseData.net_score >= quality) {
            io.emit("elimination", {
              encoded: encoded,
              winner: socket.username,
              loser: user,
            });
            console.log("User " + user + " eliminated");
          } else {
            socket.emit("update score", {
              encoded: encoded,
              user: user,
              score: responseData.net_score,
            });
          }
          responseData = "";
        });
      });

      req.on("error", function (e) {
        console.error(e);
      });
      req.write(querystring.stringify(data));
      req.end();
    }
  });
}

function save_pattern(hash, pattern) {
  var id = hash;
  var data = {
    tp: pattern,
  };

  var options = {
    hostname: base_url,
    port: 443,
    path: "/save/" + id,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
      Authorization:
        "Basic " + new Buffer(apiKey + ":" + apiSecret).toString("base64"),
    },
  };

  var responseData = "";
  var req = https.request(options, function (res) {
    res.on("data", function (chunk) {
      responseData += chunk;
    });

    res.on("end", function () {
      console.log(JSON.parse(responseData));
    });
  });

  req.on("error", function (e) {
    console.error(e);
  });
  req.write(querystring.stringify(data));
  req.end();
}

function delete_pattern(id) {
  var id = id;

  var options = {
    hostname: base_url,
    port: 443,
    path: "/user/" + id,
    method: "DELETE",
    headers: {
      "Cache-Control": "no-cache",
      Authorization:
        "Basic " + new Buffer(apiKey + ":" + apiSecret).toString("base64"),
    },
  };

  var responseData = "";
  var req = https.request(options, function (res) {
    res.on("data", function (chunk) {
      responseData += chunk;
    });

    res.on("end", function () {
      console.log(JSON.parse(responseData));
    });
  });

  req.on("error", function (e) {
    console.error(e);
  });

  req.end();
}

// hash function for id generation used at TypingDNAAPI
function hashCode() {
  var hash = 0;
  if (this.length == 0) {
    return hash;
  }
  for (var i = 0; i < this.length; i++) {
    var char = this.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash*100000;
}

// encoding function but it can be any encode function,
// as long it is supported on HTML identification
function encode() {
  //eliminate spaces and numbers
  str = this.replace(/^[\s\d]+/, "");
  str = str.replace(/\s/g, "");

  return str;
}

exports.hashCode = hashCode;
exports.encode = encode;

exports.check_patterns = check_patterns;
exports.save_pattern = save_pattern;
exports.delete_pattern = delete_pattern;
