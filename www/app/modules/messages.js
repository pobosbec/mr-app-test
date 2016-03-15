/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', '$rootScope', 'messageRepository', 'communicationService', function ($scope, $http, $rootScope, messageRepository, communicationService) {
        $scope.messages = [];

        setInterval(function(){
            $rootScope.$broadcast('download-whats-new');
        }, 10000);

        $scope.messages = messageRepository.getMessages();

        $scope.$on('messages-added', function (event, args) {
            console.log("fetching new messages!");
            $scope.messages = messageRepository.getMessages();
            $scope.$apply();
        });
    }]);