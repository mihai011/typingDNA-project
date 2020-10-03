var https = require('https');
var querystring = require('querystring');
var base_url = 'api.typingdna.com';

var apiKey = '';
var apiSecret = '';


fs = require('fs')
fs.readFile('./keys.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  data = data.split("\n");
  apiKey = data[0];
  apiSecret = data[1];
});



function check_patterns(io, socket,message_pattern, patterns ){

    Object.keys(patterns).forEach(user => {

        if (user != socket.username){

            var data = {
                tp1 : message_pattern,
                tp2 : patterns[user],
                quality : 1,
            }
    
            var options = {
                hostname : base_url,
                port : 443,
                path : '/match',
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
                    if(responseData.net_data > 70){
                        io.emit('elimination', {winner:socket.username,loser:user});
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


exports.check_patterns = check_patterns