/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', '$rootScope', 'messageRepository', 'communicationService', function ($scope, $http, $rootScope, messageRepository, communicationService) {
        $scope.messages = [];

        setInterval(function(){
            console.log('sending download-whats-new!');
            $rootScope.$broadcast('download-whats-new');
        }, 5000);
    }]);