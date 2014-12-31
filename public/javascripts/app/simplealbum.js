angular.module('SimpleAlbum', []);

angular.module('SimpleAlbum')
.controller('MainCtrl', ['$scope', '$http', '$q', function($scope, $http, $q) {
    
    function view(image) {
        $scope.viewImage = ['./albums',$scope.album.name,'photos',image].join('/');
    };
    
    function open(album) {
        $scope.album = album;
    };
    
    $scope.view = view;
    
    $scope.open = open;
    
    $http.get('albums/albums.json').success(function (names) {
        return $q.all(_.map(names, function (name) {
            return $http.get(['albums', name, 'album.json'].join('/')).then(function (res) {
                return res.data;
            });
        })).then(function (albums) {
            $scope.albums = albums;
        });
    });
    
    $http.get('albums/base/album.json').success(function (res) {
        $scope.album = res;
    });
    
    $scope.$watch('albums', function (albums, old) {
        if (albums === old) {
            return;
        }
        
        return $q.all(_.map(albums, function (album) {
            return $http.get(['albums', album, 'album.json'].join('/')).then(function (res) {
                return res.data;
            });
        })).then(function (albums) {
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