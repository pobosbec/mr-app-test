/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', '$rootScope', 'messageRepository', 'communicationService', function ($scope, $http, $rootScope, messageRepository, communicationService) {

        $scope.messages = messageRepository.getMessages();

        setInterval(function(){
            $rootScope.$broadcast('download-whats-new');
        }, 10000);

        /**
         * Just for testing
         */
        //$scope.$on('new-messages', function (event,args ) {
        //    console.log("new-message");
        //    if(args.length > 0){
        //        $scope.messages = [];
        //        for(var msg in args){
        //            $scope.messages.push(args[msg]);
        //        }
        //    }
        //});

        $scope.$on('messages-added', function (event, args) {
            $scope.messages = messageRepository.getMessages();
            //$scope.$apply();
        });
    }]);