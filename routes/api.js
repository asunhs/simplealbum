var _ = require('underscore');
var async = require('async');
var express = require('express');
var easyimage = require('easyimage');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var Promise = require('promise');
var router = express.Router();



var base = './images',
    dist = './public/images/';


function transImage (src, dist, size) {
    
    console.log('transImage');
    
    return new Promise(function (resolve, reject) {
        
        console.log('Promise');
        
        async.waterfall([
            function (cb) {
                return mkdirp(dist, cb);
            },
            function (path, cb) {
                return fs.readdir(src, cb);
            },
            function (files, cb) {
                return Promise.all(_.map(files, function (file) {
                    return easyimage.resize({
                        src : path.join(src, file),
                        dst : path.join(dist, file),
                        width : size
                    }).catch(function () {
                        return;
                    });
                })).then(function (results) {
                    return cb(null, _.compact(results));
                });
            }
        ], function (err, results) {
            if (!!err) {
                return rejcet();
            }
            return resolve(results);
        });
    });
    
}


/* GET users listing. */
router.get('/make/:album', function(req, res) {
    
    if (!req.params.album) {
        res.status(403);
        return res.send('require album name');
    }
    
    var folder = path.join(base, req.params.album);
    
    if (!folder) {
        res.status(404);
        return res.send('dose not exist album ' + req.params.album);
    }
    
    Promise.all([
        transImage(folder, path.join(dist, req.params.album, 'thumbs'), 100),
        transImage(folder, path.join(dist, req.params.album, 'photos'), 1000)
    ]).then(function (results) {
        console.log(results);
        res.send('Success');
    });
    
});

module.exports = router;


