/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('event', [])
    .controller('eventCtrl', ['$scope', '$http', 'tokenService', 'messageRepository', function ($scope, $http, tokenService, messageRepository) {

        $scope.$on('new-message', function (event, args) {
            messageRepository.on(event, args);
        });

        $scope.$on('updated-message', function (event, args) {
            messageRepository.on(event, args);
        });
    }]);