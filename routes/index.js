var express = require('express');
var router = express.Router();
var verification = require('./verification')
var randomKey = require('random-key')
var databaseConnect = require('./databaseconnect')

// TODO: make errors more specific

/* GET home page. */
//dimentions refer to how many dimentions he return data has...for a example,,,a nested array will have two dimentions if it is an array within 1 array
router.post('/join', function(req, res, next) {
    var number = req.body.number
    var vcode = req.body.verificationCode;

    join(number,vcode,function (r,e) {
        if(r.success){

            // send json
            res.send(JSON.stringify({code:1,data:"success",type:"string",dimensions:1}))
        }else {
            // send failure json
            res.send(JSON.stringify({code:0,data:r.res,type:"string",dimensions:1}))
        }
    })

  // join("0000000","68552",function (back) {
  //     console.log(back)
  // })
});
router.post('/finalize',function (req, res, next) {
    // TODO:: add provision for if image uploaded
    var fullname=req.body.fullname;
    var username=req.body.username;
    var userID = req.body.UserID;
    console.log(req.body)

    databaseConnect.targetExistsCheck("username",username,"main",function (msg) {
        if(!msg.success && msg.code===10822){
        //    go ahead and store remember to change after adding fprofile selection
            var sql = "UPDATE main SET username=?, fullname=? WHERE UserID=?";
            databaseConnect.finalizeSetup(sql,[username,fullname,userID],function (msgInner) {
                if(msgInner.success) {
                    res.send(JSON.stringify({success: true, code: 200}))
                }else {
                    console.log(msgInner)
                    res.send(JSON.stringify({success: false, code:500}))
                }
            })
        }else if(msg.success){
            // username exists
            res.send(JSON.stringify({success:false,code:201}))
        }else if(!msg.success && msg.code ===10222){
        //    error occurred
            console.log(msg)
            res.send(JSON.stringify({success:false,code:500}))
        }
    })


})
router.post('/verify',function (req, res, next) {

    var vcode = req.body.verificationCode
    var number = req.body.number
    console.log(req.body)

    databaseConnect.verify(vcode, number,function (r) {
       if(r.length===15){
       //    a length of 15 means its a valid key
           console.log(r)
           res.send(JSON.stringify({code:1, data:r, dimensions:1}))
       }else if(r==="mismatch"){
           res.send(JSON.stringify({code:0, data:r, dimensions:1}))
       }else{
           res.send(JSON.stringify({code:2, data:"unknown error", dimensions:1}))
       }
    })

})


//functions
// join

//generate accessToken



//steps to join -->enter number and country-->send verification code--> generate access token-->once accepted allow access on current device

function sendMail(verification_code,callback) {
    verification.sendMail(verification_code,function (sendMailStatus) {
        if (sendMailStatus.success){
            return callback(sendMailStatus)
        }else {
            console.log("fail area 15")
            return callback(sendMailStatus)
        }


    })

}

function join(number, verification_code, callback) {
   // send verification code to email which will be sent to user by me( i cant afford nexmo or twilio right now)


    databaseConnect.AuthUser(number,verification_code,function (res) {

        if(res.success){
        //    send verification code to user if accepted into database
            sendMail(verification_code+", "+number,function (sendMailStatus) {
                if(sendMailStatus.success){
                    return callback(sendMailStatus)
                }else {
                    console.log("fail area 12")
                    return callback(sendMailStatus)
                }
            })

        }else {
            
            callback(res)
        }
    })



}

module.exports = function (io){
    io.on('connection',function (socket) {
        var chat_id = socket.handshake.query.chat_id;

        socket.on(chat_id,function (content) {
        //    save to database and emit the event to recipient
            socket.emit(content.recipient,content)

        })
    })
    return router;
};
