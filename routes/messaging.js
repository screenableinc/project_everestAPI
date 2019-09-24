var express = require('express');
var router = express.Router();



router.post('/send', function (req, res,next) {
    var text=req.body.text;
    var timestamp = req.body.timestamp;
    var has_attachments=req.body.has_attachments;
    var type=req.body.type;
    var recipient_count = req.body.recipient_count;var recipients=req.body.recipients;
    var timestamp = req.body.timestamp;var message=req.body.message;
    var timestamp = req.body.timestamp;


})
module.exports = router;

