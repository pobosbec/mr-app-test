/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', '$rootScope', 'communicationService', 'messageRepository','tokenService', function($scope, $http, $rootScope, communicationService, messageRepository, tokenService) {

        $scope.id = tokenService.getAppUserId;
        $scope.Math = window.Math;

        $scope.loading = true;


        $scope.messages = messageRepository.getMessages();
        $scope.conversations = [];
        messagesToConversations($scope.messages, $scope.conversations);
        setInterval(function() {
            var args = { Sender: "messages", Event: 'interval' };
            $rootScope.$broadcast('download-whats-new', args);
        }, 10000);

        $scope.$on('messages-added', function(event, args) {
            $scope.messages = messageRepository.getMessages();
            $scope.conversations = [];
            messagesToConversations(messageRepository.getMessages(), $scope.conversations);
        });

        $scope.$on('$stateChangeSuccess', function () {
            setTimeout(function() { $scope.loading = false; }, 1000);
        });

        $scope.$on('$stateChangeError', function () {
            $scope.loading = false;
        });

        //converts a list of mesasges into conversations
        function messagesToConversations(messages, destination) {
            for (var msg in messages) {
                if (messages[msg].ConversationId != null) {
                    var index = findConversation(messages[msg].ConversationId);
                    //when conversation exists
                    if (index != -1) {
                        destination[index].messages.push(messages[msg]);
                        destination[index].StartPosition = destination[index].messages.length - 5;
                        if (findDisplayName(messages[msg].AuthorDisplayName, destination[index].Users) == -1) {
                            destination[index].Users.push({
                                "DisplayName": messages[msg].AuthorDisplayName,
                                "Avatar": messages[msg].Avatar
                            });
                        }
                    } else {
                        destination.push(
                            {
                                "TextArea": "",
                                "No": 5,
                                "StartPosition": 1,
                                "Users": [
                                    {
                                        "DisplayName": messages[msg].AuthorDisplayName,
                                        "Avatar": messages[msg].Avatar
                                    }
                                ],
                                "ConversationId": messages[msg].ConversationId,
                                "messages": [messages[msg]]
                            }
                        );
                    }
                }
            }
            //sort conversations
            for (var conv in destination) {

            }
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

        function findDisplayName(displayName, source) {
            for (var i in source) {
                var test = angular.equals(source[i].DisplayName, displayName);
                if (test) {
                    return i;
                }
            }
            return -1;
        }

        $scope.incrementStep = function(ConversationId) {
            var nIncr = 0;
            var no = $scope.conversations[findConversation(ConversationId)].No;
            var total = $scope.conversations[findConversation(ConversationId)].messages.length;
            if (total <= 20) {
                return total;
            } else {
                if (no < 20) {
                    nIncr = 20;
                } else if (total <= 50) {
                    nIncr = total;
                } else if (no < 50) {
                    nIncr = 50;
                } else if (total <= 100) {
                    nIncr = total;
                } else if (no < 250) {
                    nIncr = 250;
                } else if (total < 250) {
                    nIncr = total;
                } else
                    nIncr = total;
            }
            return nIncr;
        };

        $scope.incrementComments = function(n, ConversationId) {
            $scope.conversations[findConversation(ConversationId)].No = n;
            if ($scope.conversations[findConversation(ConversationId)].messages.length > n) {
                $scope.conversations[findConversation(ConversationId)].StartPosition = -n;
            } else {
                $scope.conversations[findConversation(ConversationId)].StartPosition = 1;
            }
        };

        $scope.hideComments = function(ConversationId) {
            $scope.conversations[findConversation(ConversationId)].No = 5;
            $scope.conversations[findConversation(ConversationId)].StartPosition = $scope.conversations[findConversation(ConversationId)].messages.length - 5;
        };


        $scope.reply = function(conversationId, text) {

            var content = $scope.conversations[findConversation(conversationId)].TextArea;
            if (content.length > 0 || text.length > 0) {

                var req = {
                    method: 'POST',
                    url: tokenService.currentAppApiUrl + 'app/conversations/reply',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        "Data": {
                            "ConversationId": conversationId,
                            "Message": content || text,
                            "MetaData": null
                        },
                        "AuthenticationToken": tokenService.getAppAuthToken(),
                        "Tags": null
                    }
                };
                $http(req
                ).then(function successCallback(response) {
                    // this callback will be called asynchronously
                    // when the response is available
                    //TODO check if success
                    $scope.conversations[findConversation(conversationId)].TextArea = "";
                    var args = { Sender: "messages", Event: "Reply" }
                    $rootScope.$broadcast('download-whats-new', args);
                }, function errorCallback(response) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.log("Error in reply conversation");
                });
            }
        }

    }]);