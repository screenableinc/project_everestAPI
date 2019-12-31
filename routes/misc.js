

function genRandToken(range, callback) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";

    for (var i = 0; i < range; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return callback(text);
}

module.exports={
    genRandToken:genRandToken
}