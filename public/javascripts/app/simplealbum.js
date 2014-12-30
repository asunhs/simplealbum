angular.module('SimpleAlbum', []);

angular.module('SimpleAlbum')
.controller('MainCtrl', ['$scope', '$http', function($scope, $http) {
    
    $scope.viewImage = './albums/base/photos/Penguins.jpg';
        
    $scope.view = function(image) {
        $scope.viewImage = ['./albums',$scope.album.name,'photos',image].join('/');
    };
    
    $http.get('albums/base/album.json').success(function (res) {
        $scope.album = res;
    });
}]);