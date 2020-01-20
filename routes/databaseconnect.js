var mysql = require("mysql");
var misc = require("./misc")
var async =require("async")

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

        // TODO add separate transitioning table to avoid users seasrchin or sending messages to accounts that havent been verified yet
        var sql = "INSERT INTO main (UserID, verificationCode) VALUES ('"+userID+"', '"+verificationCode+"')";
        connection.query(sql, function (err, result) {
            //if number exists use where statement to instet into
            if(err){
                return callback({success:false, res:err})
            }else if (err && err.errno===1062) {
                connection.query("UPDATE main SET verificationCode = '"+verificationCode+"' WHERE UserID = '"+userID+"'", function (err, result) {
                    if(err) {
                        return callback({success: false, res: err});
                    }
                    else {
                        return callback({success:true,res:result})
                    }
                })
            }else {
                return callback({success:true,res:result});
            }
        });

}

function verify(verificationCode,userID, callback) {
    console.log(userID, verificationCode)
    var sql = "SELECT * FROM main WHERE UserID = '"+userID+"'";
    connection.query(sql, function (err, result, fields) {
        console.log(result)
        if(err || result.length===0){
            console.log(result)
            return callback({success:false,response:err})
        }else if(result[0].verificationCode===verificationCode){
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
            return callback({success:false,data:err.errno,from:sql,code:10222})
        }else {
            if (result.length===0){
                return callback({success: false,data:"doesn't exist",code:10822})
            }else {
                return callback({success: true,code:10001})
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
function finalizeSetup(sql,values,callback) {
    connection.query(sql,values,function (err,result) {
        if(err){
            return callback({success:false,msg:err})
        }else {
            return callback({success:true,msg:result})
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
function addConnection(following,follwedby,callback) {
//    TODO add filter to check if users are already connected
    var query = "INSERT INTO connections (following, followedby) VALUES ('"+following+"', '"+follwedby+"')";
    sqlInsert(query,function (msg) {
        return callback(msg)
    })
}

function sendMessage(text, message_id, chat_id, has_attachments, type, sender, time_sent, status, parent_message_id, media_duration, media_url, media_mime_type,reciever, callback) {
    targetExistsCheck("UserID", sender,"main", function (res) {
        if(res.success){
        //    move on to check recipients existence
        //     TODO:: Note, i am startng with 1-1 chat first
            


                //    both exist, send message
                //    chat id is a combination of userIds...create if it dont exist
                //TODO optimise for multiple recipients
                var to =  reciever
                //sort chat id to make sure order is the same
                // var chat_id = [sender,to].sort();
                // chat_id=chat_id[0]+"_"+chat_id[1]
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
                            var values = [text,status,type,sender,parent_message_id,media_duration,media_url,media_mime_type,chat_id,time_sent]
                            var query = "INSERT INTO messages (text, status, type, sender, parent_message_id, media_duration, media_url, media_mime_type, chat_id, time_sent) VALUES ?"

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
function selectAll(from,column,target,callback) {
    var sql = "SELECT * FROM "+ from+" WHERE "+column+" = '"+target+"'";
    connection.query(sql,function (err,result) {
        if(err){
            return callback({success:false,data:err})
        }else {
            return callback({success:true,data:result})
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



function genFakeData(list){
    console.log(list.length)
    function recurse(i) {

        if (i < list.length) {
            var fullname = list[i]["name"]["first"] + " " + list[i]["name"]["last"];
            var username = list[i]["name"]["first"] + list[i]["name"]["last"] + "_" + i;
            var profile_pic_url = list[i]["picture"]["thumbnail"];
            var profile_pic_url_md = list[i]["picture"]["medium"];
            var profile_pic_url_lg = list[i]["picture"]["large"];
            var values = [JSON.stringify(i), fullname, profile_pic_url_md, profile_pic_url_lg, profile_pic_url,username]
            var query = "INSERT INTO main (UserID, fullname, profile_picture_url_md, profile_picture_url_lg, profile_picture_url,username) VALUES ?"
            console.log(fullname)
            var sql = sqlMultipleInsert(query, values, function (cb) {
                function innerRecurse(j){
                    if(j<15){

                                                //use media high column for soring test urls
                        var randompicname=Math.floor(Math.random() * 595)
                        var randompic="http://www.screenableinc.com/everest/"+randompicname+".jpg"
                        var randompic_med="http://www.screenableinc.com/everest/thumbnails/tn_"+randompicname+".jpg"
                        var inQ = "INSERT INTO canvas (ownerID, postID, media_url_high, media_url_med, timestamp, type) VALUES ?"
                        var token=misc.genRandToken(30,function (callback) {
                            return callback;
                        })
                        var values=[username,token,randompic,randompic_med,new Date().getTime()+"",1]
                        console.log(i)
                         sqlMultipleInsert(inQ,values, function (cb) {
                            innerRecurse(j+1)
                        })

                    }else {
                        recurse(i+1)
                    }
                }
                innerRecurse(0)
                // recurse(i+1)

            })
        }

    }
    recurse(0)
       // for (var i = 0; i < list.length; i++) {
       //
       //     console.log(fullname)
       // }




































}
function liveSearch(qs,table,param,callback){
    var sql = "SELECT * from "+table+" WHERE "+param+" LIKE '%"+qs+"%' OR username LIKE '%"+qs+"%'"


    connection.query(sql,function (err,result) {
        if(err){
            return callback({success:false,msg:err})
        }else {
            callback({success:true,data:result})
        }
    })

}
function getAllConnections(column,where, callback){
    var query = "SELECT * FROM connections WHERE "+column+" = '"+where+"'";
    connection.query(query,function (err,result) {
        if(err){
            return callback({success:false, code:500,data:err})
        }else {
            return callback({success:true, code:200,data:result})
        }
    })
}

module.exports = {
    AuthUser:AuthUser,
    verify:verify,
    selectAll:selectAll,
    addConnection:addConnection,
    getAllMessages:getAllMessages,
    sendMessage:sendMessage,
    genFakeData:genFakeData,
    liveSearch:liveSearch,
    targetExistsCheck:targetExistsCheck,
    getAllConnections:getAllConnections,
    finalizeSetup:finalizeSetup
}