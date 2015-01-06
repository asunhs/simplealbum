angular.module('SimpleAlbum', []);

angular.module('SimpleAlbum')
.controller('MainCtrl', ['$scope', '$element', '$http', '$q', function($scope, $element, $http, $q) {
    
    function view(image) {
        var photo = $element.find('div.photo > img');
        
        photo.removeClass('visible').addClass('hidden').one('transitionend', function () {
            $scope.viewImage = ['./albums',$scope.album.name,'photos',image].join('/');

            photo.one('load', function (e) {
                photo.removeClass('hidden none').addClass('visible');
            });
            
            $scope.$apply();
        });
    }
    
    function open(album) {
        $scope.album = album;
    }
    
    function getPhotos(names) {
        return $q.all(_.map(names, function (name) {
            return $http.get(['albums', name, 'album.json'].join('/')).then(function (res) {
                return res.data;
            });
        }));
    };
    
    $scope.view = view;
    
    $scope.open = open;
    
    $http.get('albums/albums.json').success(function (names) {
        
        $scope.albumNames = names;
        
        return getPhotos(names).then(function (albums) {
            $scope.albums = albums;
        });
    });
    
    $http.get('albums/base/album.json').success(function (res) {
        $scope.album = res;
    });
    
    $scope.$watch('albumNames', function (albumNames, old) {
        if (albumNames === old) {
            return;
        }
        
        return getPhotos(albumNames).then(function (albums) {
            console.log(albums);
        });
    });
    
    $scope.$watch('album', function (album, oldAlbum) {
        if (album === oldAlbum) {
            return;
        }
        
        view(album.images[0]);
    });
}]);