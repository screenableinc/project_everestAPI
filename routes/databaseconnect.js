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
        console.log(sql,"wise")
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

function sqlInsert(sql, callback) {
    connection.query(sql,function (err, result) {
        if(err){
            return callback({success:false, src:"sqlInsert",msg:err})
        }else {
            return callback({success:true, src:"sqlInsert"})
        }
    })

}
function sqlMultipleInsert(sql, values, callback){
    connection.query(sql, [[values]], function (err,result) {
        if (err){

            return callback({success:false, msg:err, src:"sqlMultipleInsert"})
        }else {

            return callback({success:true, msg:result})
        }
    })
}

function sendMessage(text, message_id, chat_id, time_recieved, has_attachments, type, recipient_count, recipients, sender, time_sent, status, parent_message_id, media_duration, media_url, media_mime_type, callback) {
    targetExistsCheck("UserID", sender,"main", function (res) {
        if(res.success){
        //    move on to check recipients existence
        //     TODO:: Note, i am startng with 1-1 chat first
            


                //    both exist, send message
                //    chat id is a combination of userIds...create if it dont exist
                //TODO optimise for multiple recipients
                var to =  JSON.parse(recipients)[0]
                var chat_id = sender+"_"+to
                var sql = "INSERT INTO chats (chat_id, last_message) VALUES ('"+chat_id+"', '"+message_id+"')";

                connection.query(sql, function (err, result) {

                    //if number exists use where statement to insert into
                    var errorNo=0
                    try {
                        errorNo=err.errno
                    }catch (e) {
                        ""
                    }

                    if (errorNo===1062) {
                        connection.query("UPDATE chats SET last_message = '"+message_id+"', chat_id = '"+chat_id+"'", function (err, result) {
                            if(err)return callback({success:false,error:err});

                            //insert_message
                            var values = [text,time_recieved,status,type,sender,parent_message_id,media_duration,media_url,media_mime_type,chat_id,time_sent]
                            var query = "INSERT INTO messages (text, time_received, status, type, sender, parent_message_id, media_duration, media_url, media_mime_type, chat_id, time_sent) VALUES ?"

                            sqlMultipleInsert(query,values,function (res) {
                                //great now add to the recipients table if success.. this is so owners of the message can check easily
                                if (res.success){
                                    var messageId = res.msg.insertId;

                                    var sql = "INSERT INTO message_recipient (message_id, recipient_id) VALUES ('"+messageId+"', '"+to+"')";

                                    sqlInsert(sql,function (res) {
                                        if(res.success){
                                            return callback(res)
                                        }else {
                                            return callback(res)
                                        }
                                    })
                                }

                            })



                        })
                    }else if(err){
                        return {success:false,msg:"here"}
                    }else{
                    //    insert message into db without setting last message ok
                        var values = [message_id,text,time_recieved,status,type,sender,parent_message_id,media_duration,media_url,media_mime_type,chat_id,time_sent]
                        var query = "INSERT INTO messages (message_id, text, time_received, status, type, sender, parent_message_id, media_duration, media_url, media_mime_type, chat_id, recipient, time_sent) VALUES ?"

                        sqlMultipleInsert(query,values,function (res) {
                            if (res.success){
                                var messageId = res.msg.insertId;

                                var sql = "INSERT INTO message_recipient (message_id, recipient_id) VALUES ('"+messageId+"', '"+to+"')";

                                sqlInsert(sql,function (res) {
                                    if(res.success){
                                        return callback(res)
                                    }else {
                                        return callback(res)
                                    }
                                })
                            }else{
                                return callback(res)
                            }
                        })

                    }


                });



            }else {
                //return which one failed
                return callback({success:false, which:2})
            }
        })


}

// function sendMessage(text, message_id, chat_id, time_recieved, has_attachments, type, recipient_count, recipients, sender, time_sent, status, parent_message_id, media_duration, media_url, media_mime_type ) {
//
// }

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