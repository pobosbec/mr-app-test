/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('event', [])
    .controller('eventCtrl', ['$scope', '$rootScope', '$http', 'tokenService', 'messageRepository', function ($scope, $rootScope, $http, tokenService, messageRepository) {

        document.addEventListener('deviceready', function (event, args) {
            $rootScope.$broadcast('device-ready', args);
        }, false);

        $scope.$on('device-ready', function (event, args) {
            messageRepository.on(event, args);
        });

        $scope.$on('new-messages', function (event, args) {
            messageRepository.on(event, args);
        });

        $scope.$on('updated-message', function (event, args) {
            messageRepository.on(event, args);
        });
    }]);