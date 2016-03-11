/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', 'messageRepository', function ($scope, $http, messageRepository) {


        $scope.messages = messageRepository.getMessages();
        $scope.test = function () {
            alert("1");
            $scope.testtest = messageRepository.testtest();
            alert($scope.testtest);
        }
        
    }]);