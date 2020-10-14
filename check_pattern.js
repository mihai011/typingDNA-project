var https = require('https');
var querystring = require('querystring');
var base_url = 'api.typingdna.com';

var apiKey = '';
var apiSecret = '';

//read the secrets so we can get on with our life 
fs = require('fs')
fs.readFile('./keys.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  data = data.split("\n");
  apiKey = data[0];
  apiSecret = data[1];
});



function check_patterns(io, socket, message_pattern, users){

    Object.keys(users).forEach(user => {

        if (user != socket.username){

            var id = users[user];
            var data = {
                tp : message_pattern,
                quality : 1,
            }

            var options = {
                hostname : base_url,
                port : 443,
                path : '/verify/' + id,
                method : 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cache-Control': 'no-cache',
                    'Authorization': 'Basic ' + new Buffer(apiKey + ':' + apiSecret).toString('base64'),
                },
            };
    
            var responseData = '';
            var req = https.request(options, function(res) {
                res.on('data', function(chunk) {
                    responseData += chunk;
                });
    
                res.on('end', function() {
                    
                    responseData = JSON.parse(responseData);
                    console.log(responseData);
                    if(responseData.net_score >= 50){
                        io.emit('elimination', {winner:socket.username,loser:user});
                        console.log("user "+user+" eliminated");
                    }
                    else{
                        socket.emit('update score', {user:user, score:responseData.net_score});
                    }
                   
                    responseData = "";
                });
            });
    
            req.on('error', function(e) {
                console.error(e);
            });
            req.write(
                querystring.stringify(data)
            );
            req.end();
            }
        
        
    });

        

};

function save_pattern(username, pattern){

    var id  = username;
    var data = {
        tp : pattern,
     }
     
     var options = {
        hostname : base_url,
        port : 443,
        path : '/save/' + id,
        method : 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache',
            'Authorization': 'Basic ' + new Buffer(apiKey + ':' + apiSecret).toString('base64'),
        },
     };
     
     var responseData = '';
     var req = https.request(options, function(res) {
        res.on('data', function(chunk) {
            responseData += chunk;
        });
     
        res.on('end', function() {
            console.log(JSON.parse(responseData));
        });
     });
     
     req.on('error', function(e) {
        console.error(e);
     });
     req.write(
        querystring.stringify(data)
     );
     req.end();
}


exports.check_patterns = check_patterns;
exports.save_pattern = save_pattern;