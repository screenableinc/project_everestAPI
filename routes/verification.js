var nodemailer = require('nodemailer');



function sendMail(message, callback) {


    var to = "circleverify@gmail.com";
    var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "circleverify@gmail.com",
            pass: "w1se097768638810"

        }
    });
    var mailOptions = {
        from: "me",
        to: to,
        subject: 'New User Verification',
        text: message.toString()
    }
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error, message)
            return callback("fail")
        }else{
            return callback("success")
        }
    });
}
module.exports = {
    sendMail:sendMail
}