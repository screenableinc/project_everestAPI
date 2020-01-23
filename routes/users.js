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
    //todo ::make this code simpler there must be a way to query once via foreign key
    console.log("here")
    //resolve to get username
    databaseconnect.selectAll("main","UserID",target,function (cb) {

        if(cb.success){
            var userdata=cb.data[0]

            databaseconnect.selectAll("canvas","ownerId",userdata["username"],function (cb) {

                if(cb.success){
                    res.send({success:true,code:200,userdata:userdata,canvasdata:cb.data})
                }else {res.send({success: false,code: 500})}
            })
        }else {
            console.log(cb)
            res.send({success: false,code: 500})}
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
router.get('/connections/all',function (req, res, next) {
//    TODO::filter to add whrer clause
    var connectionType = req.query.connectionType;
    var target = req.query.target;
    databaseconnect.getAllConnections(connectionType,target,function (msg) {
        res.send(JSON.stringify(msg))
    })
})
router.get('/add/connection',function (req, res, next) {
    var following = req.query.following;
    var follower = req.query.follower;
    databaseconnect.targetExistsCheck("follower",follower,"connections",function (follwermsg) {
        if(follwermsg.code===10822){
        //    foller exists..check following
            databaseconnect.targetExistsCheck("following",following,"connections",function (followingMsg) {
                if(followingMsg.code===10822){
                    // following exists
                    databaseconnect.addConnection(following,follower,function (msg) {
                        res.send(msg)
                    })
                }
            })
        }
    })
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

