var mysql = require("mysql");


var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'w1se097768638810',
    database: "everest"

});

connection.connect(function(err) {
    if (err) throw err;

});
function AuthUser(userID, verificationCode, callback){


        var sql = "INSERT INTO main (UserID, verificationCode) VALUES ('"+userID+"', '"+verificationCode+"')";
        connection.query(sql, function (err, result) {
            //if number exists use where statement to instet into
            
            if (err.errno===1062) {
                connection.query("UPDATE main SET verificationCode = '"+verificationCode+"' WHERE UserID = '"+userID+"'", function (err, result) {
                    if(err)return callback(err);
                    console.log(result)
                    return("success","whoa")
                })
            };
            return callback("success");
        });

}

function verify(verificationCode,userID, callback) {
    console.log(userID, verificationCode)
    var sql = "SELECT * FROM main WHERE UserID = '"+userID+"'";
    connection.query(sql, function (err, result, fields) {
        if(result[0].verificationCode===verificationCode){
        //    gen access token and save to database
            genAccessToken(function (text) {
               var query = "UPDATE main SET accessToken = '"+text+"' WHERE UserID = '"+userID+"'"
                connection.query(query, function (err, result) {
                    if(err){
                        return callback(err)
                    }else{
                        return callback(text)
                    }
                })
            })
        }else {
            console.log(verificationCode, result[0].verificationCode,"reached")
            return callback("mismatch")
        }

    })
}

function validate_user(userId, accessToken, callback) {
    var sql = "SELECT * FROM main WHERE UserID = '"+userId+"' AND accessToken ='"+ accessToken +"'";
    connection.query(sql, function(err,result) {
        console.log(sql)
        if (err) {
            // TODO: handle error
            return callback({success: false})
        } else {
            return callback({success: true})
        }

    })
}

function getAllMessages(userId, accessToken, callback){
    validate_user(userId,accessToken,function (res) {
        if(res["success"]===true){
            var sql = "SELECT * FROM messages WHERE sender = '"+userId+"' OR recipient ='"+ userId +"'";
            console.log(sql)
            connection.query(sql, function (err, result) {
                if (err){
                    return callback({success:false,error:err})
                }else {
                    return callback({success:true,data:result})
                }

            })
        }else {
            return callback({success:false})

        }
    })

    }

function targetExistsCheck(targetParam, targetValue,targetTable, callback) {
    var sql = "SELECT * FROM "+targetTable+" WHERE "+ targetParam+" = '"+targetValue+"'";
    connection.query(sql,function (err, result) {
        if (err){
            return callback({success:false,data:err.errno,from:sql})
        }else {
            if (result.length===0){
                return callback({success: false,data:"doesn't exist"})
            }else {
                return callback({success: true})
            }
        }
    })
}

function sendMessage(UserId, to,message, time_received, timeSent,status,type,parentMessage, mediaDuration,media_url,thumbnail, message_id,callback) {
    targetExistsCheck("UserID", UserId,"main", function (res) {
        if(res.success){
        //    move on to check recipients existence
            targetExistsCheck("UserID",to,"main",function (res) {
                if(res.success){

                //    both exist, send message
                //    chat id is a combination of userIds...create if it dont exist
                    var chat_id = UserId+"_"+to
                    var sql = "INSERT INTO chats (chat_id, last_message) VALUES ('"+chat_id+"', '"+message_id+"')";
                    var message = "INSERT INTO chats (chat_id, message) VALUES ('"+chat_id+"', '"+message_id+"')";
                    connection.query(sql, function (err, result) {
                        //TODO figure out message id retrieval after auto-increamentq
                        //if number exists use where statement to insert into
                        if (err &&err.errno===1062) {
                            connection.query("UPDATE chats SET last_message = '"+message_id+"' chat_id = '"+chat_id+"'", function (err, result) {
                                if(err)return callback({success:false,error:err});

                                return callback({success:true})
                            })
                        }else if(err){
                            return {success:false}
                        }else{
                        //    insert message into db

                        }


                    });



                }else {
                    //return which one failed
                    return callback({success:false, which:2})
                }
            })
        }else {
            return callback({success:false,which:1})
        }
    })
}

function sendMessage() {
    
}

function genAccessToken(callback) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 15; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return callback(text);
}

module.exports = {
    AuthUser:AuthUser,
    verify:verify,
    getAllMessages:getAllMessages,
    sendMessage:sendMessage
}