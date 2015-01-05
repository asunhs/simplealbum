var _ = require('underscore');
var async = require('async');
var express = require('express');
var easyimage = require('easyimage');
var fs = require('fs-extra');
var path = require('path');
var Promise = require('promise');
var router = express.Router();



var BASE = './albums',
    DIST = './public/albums/';


function getAlbums() {
    return new Promise(function (resolve, reject) {
        async.waterfall([
            function (cb) {
                return fs.readdir(BASE, cb);
            },
            function (files, cb) {
                return async.filter(files, function (file, cb) {
                    fs.stat(path.join(BASE, file), function (err, stat) {
                        return cb(stat.isDirectory());
                    });
                }, function (dirs) {
                    cb(null, dirs);
                });
            }
        ], function (err, dirs) {
            if (!!err) {
                return reject();
            }
            return resolve(dirs);
        });
    });
}

function readImages(src) {
    return new Promise(function (resolve, reject) {
        return fs.readdir(src, function (err, files) {
            if (!!err) {
                return reject();
            }
            return resolve(files);
        });
    });
}


function getValidImages(src, files) {
    
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


function getAlbumProfile(src) {
    return new Promise(function (resolve, reject) {
        return fs.readFile(path.join(src, 'album.json'), function (err, file) {
            try {
                return resolve(JSON.parse(file));
            } catch (err) {
                return resolve();
            }
        });
    });
}



function transImage(files, src, dist, size) {
    
    return new Promise(function (resolve, reject) {
        
        async.waterfall([
            function (cb) {
                return fs.mkdirs(dist, cb);
            },
            function (dirpath, cb) {
                return Promise.all(_.map(files, function (file) {
                    return easyimage.resize({
                        src : path.join(src, file),
                        dst : path.join(dist, file),
                        width : size
                    }).then(function () {
                        console.log('resized %s', file);
                    }).catch(function () {
                        return;
                    });
                })).then(function (results) {
                    return cb(null, _.compact(results));
                });
            }
        ], function (err, results) {
            if (!!err) {
                console.log('image resizing fail from %s to %s', src, dist);
                return rejcet();
            }
            console.log('all images resized from %s to %s', src, dist);
            return resolve(results);
        });
    });
    
}


function makeAlbum(name, images) {
    
    return getAlbumProfile(path.join(BASE, name)).then(function (profile) {
        
        return new Promise(function (resolve, reject) {
        
            var album = _.extend({
                name : name,
                images : _.map(images, _.identity)
            }, profile);

            async.waterfall([
                function (cb) {
                    return fs.mkdirs(path.join(DIST, name), cb);
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
    });
}


function build(name) {
    
    var src = path.join(BASE, name),
        dist = path.join(DIST, name);
    
    if (!src) {
        throw new Error('not exits album');
    }
    
    return new Promise(function (resolve, reject) {
        fs.remove(dist, function (err) {
            if (!!err) {
                return reject();
            }
            return resolve();
        });
    }).then(function () {
        return getValidImages(src);
    }).then(function (files) {
        return Promise.all([
            makeAlbum(name, files),
            transImage(files, src, path.join(dist, 'thumbs'), 60),
            transImage(files, src, path.join(dist, 'photos'), 960)
        ]);
    }).then(function (results) {
        return results[0];
    });
}



router.get('/albums', function (req, res) {
    return getAlbums().then(function (albums) {
        fs.writeFile(path.join(DIST, 'albums.json'), JSON.stringify(albums));
        res.json(albums);
    });
});


router.get('/build/:album', function(req, res) {
    
    if (!req.params.album) {
        res.status(403);
        return res.send('require album name');
    }
    
    try {
        return build(req.params.album).then(function (album) {
            return res.json(album);
        }).catch(function () {
            res.status(500);
            return res.send('Build Fail');
        });
    } catch (err) {
        res.status(500);
        return res.send('dose not exist album ' + req.params.album);
    }
    
});


router.get('/rebuild', function (req, res) {
    
    return new Promise(function (resolve, reject) {
        async.waterfall([
            _.partial(fs.remove, DIST),
            _.partial(fs.mkdirs, DIST),
        ], function (err) {
            if (!!err) {
                return reject();
            }
            return resolve();
        });
    }).then(getAlbums).then(function (names) {
        fs.writeFile(path.join(DIST, 'albums.json'), JSON.stringify(names));
        
        return async.map(names, function (name, cb) {
            return build(name).then(function (album) {
                cb(null, name);
            }).catch(function () {
                cb();
            });
        }, function (err, names) {
            res.json(_.compact(names));
        });
        
    });
});

module.exports = router;


