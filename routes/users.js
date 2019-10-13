var express = require('express');
var router = express.Router();
var databaseconnect = require('./databaseconnect')
/* GET users listing. */
router.get('/messages/all', function(req, res, next) {

    var accessToken  = req.query.accessToken;
    var number = req.query.number;
    var category = req.query.category;
    switch (category){
        case "all":
            databaseconnect.getAllMessages(number, accessToken,function (result) {
                if(result.success){
                    res.send(result)
                }else {
                    res.send(result)
                }
            })
        case "send":
            databaseconnect.sendMessage()
    }



  res.send('respond with a resource');
});
router.post('/messages/send', function (req, res, next) {




})

module.exports = router;

