var https = require('https');
var querystring = require('querystring');
var base_url = 'api.typingdna.com';

var apiKey = process.env.APIKEY;
var apiSecret = process.env.APISECRET;


function check_patterns(io, socket, message_pattern, users){

    Object.keys(users).forEach(user => {

        if (user != socket.username){

            var id = users[user]["hash"];
            var encoded = users[user]["encoded"];
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
                    if(responseData.net_score >= parseInt(process.env.THRESHOLD)){
                        io.emit('elimination', {encoded:encoded, winner:socket.username,loser:user});
                        console.log("User "+user+" eliminated");
                    }
                    else{
                        socket.emit('update score', {encoded:encoded, user:user, score:responseData.net_score});
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

function save_pattern(hash, pattern){

    var id  = hash;
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


function delete_pattern(id){

    var id = id;

    var options = {
        hostname : base_url,
        port : 443,
        path : '/user/' + id,
        method : 'DELETE',
        headers: {
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

    req.end();
}

exports.check_patterns = check_patterns;
exports.save_pattern = save_pattern;
exports.delete_pattern = delete_pattern;