/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('event', [])
    .controller('eventCtrl', ['$scope', '$http', 'tokenService', 'messageRepository', 'communicationService', function ($scope, $http, tokenService, messageRepository, communicationService) {

        $scope.$on('new-messages', function (event, args) {
            messageRepository.on(event, args);
        });

        $scope.$on('updated-message', function (event, args) {
            messageRepository.on(event, args);
        });

        $scope.$on('download-whats-new', function (event, args) {
            communicationService.on(event, args);
        });
    }]);