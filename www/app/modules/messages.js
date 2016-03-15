/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', '$rootScope', 'messageRepository', 'communicationService', function ($scope, $http, $rootScope, messageRepository, communicationService) {
        $scope.messages = [];

        setInterval(function(){
            $rootScope.$broadcast('download-whats-new');
        }, 10000);


        $scope.$on('new-messages', function (event,args ) {
            console.log("new-message");
            for(var msg in args){
                $scope.messages.push(args[msg]);
            }

        });


    }]);