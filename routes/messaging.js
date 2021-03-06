var express = require('express');
var router = express.Router();
var databaseconnect = require('./databaseconnect')


router.post('/send', function (req, res,next) {
    var message_id = req.body.message_id;
    var text = req.body.text;

    var status = req.body.status;
    var type = req.body.type;
    var sender = req.body.sender;
    var parent_message_id = req.body.parent_message_id;
    var media_duration = req.body.media_duration;
    var media_url = req.body.media_url;
    var media_mime_type = req.body.media_mime_type;
    var chat_id = req.body.chat_id;
    var has_attachments=req.body.has_attachments;

    var time_sent=req.body.time_sent;
    console.log(req.body)
    databaseconnect.sendMessage(text,message_id,chat_id,has_attachments,type, sender,time_sent,status,parent_message_id,
        media_duration,media_url,media_mime_type,function (msg) {

            res.send(msg)
        })




})
module.exports = router;

