angular.module('SimpleAlbum', ['ngRoute']);

angular.module('SimpleAlbum')
.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/:theme', {templateUrl: 'book.html' }).otherwise('/basic');
}])
.controller('MainCtrl', ['$scope', '$element', '$http', '$q', '$routeParams', function($scope, $element, $http, $q, $routeParams) {
    
    function view(image) {
        
        if (!image || $scope.viewImage === image) {
            return;
        }
        
        var photo = $element.find('div.photo > img');
        
        photo.removeClass('visible').addClass('hidden').one('transitionend', function () {
            $scope.viewImage = image;

            photo.one('load', function (e) {
                photo.removeClass('hidden none').addClass('visible');
            });
            
            $scope.$apply();
        });
    }
    
    function prev() {
        try {
            view($scope.album.images[$scope.album.images.indexOf($scope.viewImage)-1]);
        } catch (err) {}
    }
    
    function next() {
        try {
            view($scope.album.images[$scope.album.images.indexOf($scope.viewImage)+1]);
        } catch (err) {}
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
    
    $scope.theme = $routeParams.theme;
    
    $scope.view = view;
    
    $scope.prev = prev;
    
    $scope.next = next;
    
    $scope.open = open;
    
    $http.get('albums/albums.json').success(function (names) {
        
        $scope.albumNames = names;
        
        return getPhotos(names).then(function (albums) {
            $scope.albums = albums;
            $scope.album = $scope.albums[0];
        });
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