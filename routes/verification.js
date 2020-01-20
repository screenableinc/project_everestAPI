var nodemailer = require('nodemailer');



function sendMail(verification_code, callback) {
    var transporter = nodemailer.createTransport({
        host: 'premium76.web-hosting.com',
        port: 465,

        auth: {
            user: 'accounts@screenableinc.com',
            pass: 'Q6d7X.Uxz^LN'
        }
    });

    var mailOptions = {
        from: 'accounts@screenableinc.com', // sender address
        to: "wisesibindi@gmail.com", // list of receivers
        subject: 'Verification Code', // Subject line
        html: verification_code// plain text body
    };

    transporter.sendMail(mailOptions, function (err, info) {
        if(err){
            console.log(err)
            return callback({success:false,error:err})}
        else
            callback({success:true, msg:info});
    });
}
module.exports = {
    sendMail:sendMail
}