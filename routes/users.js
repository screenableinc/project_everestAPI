var express = require('express');
var router = express.Router();
var databaseconnect = require('./databaseconnect')
var request  = require('ajax-request')
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
router.get('/canvas', function (req,res,next) {
    var target=req.query.target;
    databaseconnect.selectAll("canvas","ownerId",target,function (cb) {
        res.send(JSON.stringify(cb))
    })

})
router.get('/search',function (req, res ,next) {
    var qs = req.query.qs;
    console.log(req.query)

 // TODO:  remember to authenticate user
    databaseconnect.liveSearch(qs,"main","UserID",function (msg) {
        res.send(msg)
    });


});
router.get('/add/connection',function (req, res, next) {
    var following = req.body.following;
    var follower = req.body.follower;
    databaseconnect.addConnection(following,follower,function (msg) {
        res.send(msg)
    })

})
router.post('/messages/send', function (req, res, next) {




})
router.get('/genFake', function (req, res, next) {


    var request = require('request');
    request({ url: 'https://randomuser.me/api/?results=5000&nat=us,fr,dk,au,ie,ir', qs: {
        dataType:'json'
    } }, async function (error, response, body) {
    // console.log('error:', error); // Print the error if one occurred
    // console.log('statusCode:', response && response.statusCode);
    // Print the response status code if a response was received
    var results = JSON.parse(body)["results"];
        // console.log('body:', results); // Print the HTTP body

        var func = await databaseconnect.genFakeData(results)
        res.send("done")
});



})



module.exports = router;

