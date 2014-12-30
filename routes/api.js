var _ = require('underscore');
var async = require('async');
var express = require('express');
var easyimage = require('easyimage');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var Promise = require('promise');
var router = express.Router();



var BASE = './albums',
    DIST = './public/albums/';


function readImages (src) {
    return new Promise(function (resolve, reject) {
        return fs.readdir(src, function (err, files) {
            if (!!err) {
                return reject();
            }
            return resolve(files);
        });
    });
}


function getValidImages (src, files) {
    
    if (!files) {
        return readImages(src).then(function (files) {
           return getValidImages(src, files); 
        });
    }
    
    return Promise.all(_.map(files, function (file) {
        return easyimage.info(path.join(src, file)).then(function () {
            return file;
        }).catch(function () {
            return;
        });
    })).then(function (results) {
        return _.compact(results);
    });
}



function transImage (files, src, dist, size) {
    
    return new Promise(function (resolve, reject) {
        
        async.waterfall([
            function (cb) {
                return mkdirp(dist, cb);
            },
            function (dirpath, cb) {
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


function makeAlbum(name, images) {
    
    return new Promise(function (resolve, reject) {
        
        var album = {
            name : name,
            images : _.map(images, _.identity)
        };
        
        async.waterfall([
            function (cb) {
                return mkdirp(path.join(DIST, name), cb);
            },
            function (dirpath, cb) {
                fs.writeFile(path.join(DIST, name, 'album.json'), JSON.stringify(album), cb);
            }
        ], function (err) {
            if (!!err) {
                return rejcet();
            }
            return resolve(album);
        });
    });
}


router.get('/make/:album', function(req, res) {
    
    if (!req.params.album) {
        res.status(403);
        return res.send('require album name');
    }
    
    var name = req.params.album,
        src = path.join(BASE, name);
    
    if (!src) {
        res.status(404);
        return res.send('dose not exist album ' + name);
    }
    
    return getValidImages(src).then(function (files) {
        return Promise.all([
            makeAlbum(name, files),
            transImage(files, src, path.join(DIST, name, 'thumbs'), 60),
            transImage(files, src, path.join(DIST, name, 'photos'), 960)
        ]).then(function (results) {
            console.log(results[0]);
            res.send('Success');
        });
    });
    
});

module.exports = router;


