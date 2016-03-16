/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', '$rootScope', 'communicationService', 'messageRepository', function ($scope, $http, $rootScope, communicationService, messageRepository) {

        $scope.messages = messageRepository.getMessages();
        $scope.conversations = [];
        $scope.noobs = [{"hehe": "haa"},
            {"hehe": "tjoo"}
        ];
        messagesToConversations($scope.messages,$scope.conversations);

        setInterval(function () {
            $rootScope.$broadcast('download-whats-new');
        }, 10000);

        $scope.$on('messages-added', function (event, args) {
            $scope.messages = messageRepository.getMessages();
             messagesToConversations(messageRepository.getMessages(),$scope.conversations);
        });


        //converts a list of mesasges into conversations
        function messagesToConversations(messages,destination) {

            for (var msg in messages) {
                if (messages[msg].ConversationId != null) {
                    var index = findConversation(messages[msg].ConversationId);
                    //when conversation exists
                    if (index != -1) {
                        destination[index].messages.push(messages[msg]);
                    }
                    else {
                        destination.push(
                            {
                                "ConversationId": messages[msg].ConversationId,
                                "messages": [messages[msg]]
                            }
                        );
                    }
                }
            }
            console.log($scope.conversations);
        }

        //function to find the index of an certain conversations
        function findConversation(id) {
            for (var i in $scope.conversations) {
                var test = angular.equals($scope.conversations[i].ConversationId, id);
                if (test) {
                    return i;
                }
            }
            return -1;
        }

    }]);