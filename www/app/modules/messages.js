/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', '$rootScope', 'messageRepository', function ($scope, $http, $rootScope, messageRepository) {

        $scope.messages = messageRepository.getMessages();
    }]);