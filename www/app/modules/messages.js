/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', '$rootScope', 'communicationService', 'messageRepository', function ($scope, $http, $rootScope, communicationService, messageRepository) {

        $scope.messages = messageRepository.getMessages();
        $scope.conversations =[];
        $scope.conversations =messagesToConversations($scope.messages);

        setInterval(function () {
            $rootScope.$broadcast('download-whats-new');
        }, 10000);

        $scope.$on('messages-added', function (event, args) {
            $scope.messages = messageRepository.getMessages();
            $scope.conversations = messagesToConversations(messageRepository.getMessages());
        });

        //converts a list of mesasges into conversations
        function messagesToConversations (messages){
            console.log(messages[0].ConversationId);
            console.log(messages);
            for (var msg in messages) {
                var index = findConversation(msg.ConversationId);
                console.log("conversationid: "+ index);
                //when conversation exists
                if(index != -1){
                    $scope.conversations[index].messages.push(msg);
                }
                else {
                    $scope.conversations.push(
                        {
                            "ConversationId": msg.ConversationId,
                            "messages": [msg]
                        }
                    );
                }
            }
            console.log($scope.conversations);
        }

        //function to find the index of an certain conversations
        function findConversation(id) {
            console.log(id);
            for (var i in $scope.conversations) {
               var test = angular.equals($scope.conversations[i].ConversationId, id);
                if (test) {
                    console.log("match");
                    return i;
                }
            }
            return -1;
        }

    }]);