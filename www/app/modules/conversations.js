/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('conversations', [])
    .controller('conversationsCtrl', ['$scope', '$http', '$rootScope', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', function($scope, $http, $rootScope, tokenService, contactsService, communicationService, messageRepository) {

        $scope.conversations = [];
        $scope.userId = null;
        $scope.appUsers = [];

        $scope.doesConversationExist = function(users) {
            return communicationService.doesConversationExist(users);
        };

        $scope.sync = function(from, to){
          communicationService.syncPeriodMessages(from.toJSON(), to.toJSON(), 0, 50);
        };

        $scope.getAvatar = function(appUserId) {

            var found = null;

            for(var i = 0; i < $scope.appUsers.length; i++){
                var appUser = $scope.appUsers[i];

                if(appUser.userId === appUserId){
                    found =  $scope.appUsers[i].avatar;
                }
            }

            if(found != null){
                return found;
            }
        };

        function init(){
            $scope.userId = tokenService.getAppUserId();
            var appUsersPromise = contactsService.getAppUsers();

            appUsersPromise.then(
                function(success){
                    $scope.appUsers = success;
                },
                function(error){
                    console.log(JSON.stringify(error));
                });

            var existingConversationsIdsPromise = messageRepository.getConversations(0, 100);

            existingConversationsIdsPromise.then(
                function(existingConversationsSuccess){
                    for(var i = 0; i < existingConversationsSuccess.length; i++){

                        setupConversation(existingConversationsSuccess[i]);

                        function setupConversation(id) {
                            var conversation = { ConversationId: id, Messages: [], AuthorDisplayNames: [], AuthorIds: [] };

                            var conversationMessagesPromise =
                                messageRepository.getMessagesByConversation(conversation.ConversationId, 0, 500);

                            conversationMessagesPromise.then(
                                function (conversationMessagesSuccess){
                                    conversation.Messages = conversationMessagesSuccess;

                                    // Checks every message AuthorDisplayName & AuthorId, adds to conversation properties if does not already exist
                                    for(var j = 0; j < conversation.Messages.length; j++){
                                        if(conversation.AuthorDisplayNames.indexOf(conversation.Messages[j].AuthorDisplayName) === -1){
                                            conversation.AuthorDisplayNames.push(conversation.Messages[j].AuthorDisplayName);
                                        }

                                        if(conversation.AuthorIds.indexOf(conversation.Messages[j].Author) === -1){
                                            conversation.AuthorIds.push(conversation.Messages[j].Author);
                                        }
                                    }

                                    $scope.conversations.push(conversation);
                                },
                                function(error){
                                    console.log('Could not get messages for conversation.')
                                });
                        }
                    }
                },
                function(error){
                    alert('Could not load conversations.')
                });
        };
        init();

    }])

    .controller('conversationCtrl', ['$scope', '$http', '$rootScope', 'tokenService', 'contactsService', 'communicationService', 'messageRepository','$stateParams', function($scope, $http, $rootScope, tokenService, contactsService, communicationService, messageRepository, $stateParams) {

        $scope.conversationId = $stateParams.conversationId;
        $scope.currentReplyMessage = "";
        $scope.userId = null;
        $scope.conversation = [];

        $scope.orderConversation = function(conversationId){
            var conversation = {};

            conversation.Messages = [];
            conversation.AuthorDisplayNames = [];
            conversation.UserIds = [];
            conversation.ConversationId = conversationId;

            for (var k = 0; k < $scope.messages.length; k++){
                if($scope.messages[k].ConversationId === conversation.ConversationId){
                    conversation.Messages.push($scope.messages[k]);

                    if(conversation.AuthorDisplayNames.indexOf($scope.messages[k].AuthorDisplayName) === -1){
                        conversation.AuthorDisplayNames.push($scope.messages[k].AuthorDisplayName);
                    }

                    if(conversation.UserIds.indexOf($scope.messages[k].Author) === -1){
                        conversation.UserIds.push($scope.messages[k].Author);
                    }
                }
            }

            return conversation;
        }

        $scope.reply = function(message, conversationId){

            $scope.currentReplyMessage = "";

            var req = {
                method: 'POST',
                url: tokenService.currentAppApiUrl + 'app/conversations/reply',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        ConversationId: conversationId,
                        Message: message,
                        MetaData: []
                    },
                    AuthenticationToken: tokenService.getAppAuthToken()
                }
            };

            var promise = tokenService.httpPost(req);

            promise.then(
                function(success){
                    var newMessage = {
                        MessageId: success.data.messageId,
                        Author: success.data.authorId,
                        ConversationId: success.data.conversationId,
                        Content: success.data.content,
                        CreatedOn: success.data.createdOn
                    };
                    $scope.conversation.Messages.push(newMessage);
                },
                function(error){
                    console.log('Could not reply to conversation.')
                });
        }

        $scope.clearReplyMessages = function(){
            $scope.currentReplyMessage = "";
        }

        $scope.captureReplyMessageInput = function (conversationId, input) {
            for (var i = 0; i < $scope.replyMessages.length; i++){
                if($scope.replyMessages[i].ConversationId === conversationId){
                    $scope.replyMessages[i].ReplyMessage = input;
                }
            }
        }

        $scope.loadMoreForConversation = function(){

            var promise = messageRepository.getMessagesForConversation(
                $scope.conversationId,
                $scope.conversation.Messages.length,
                3);

            promise.then(
                function(success){
                    for(var i = 0; i < success.length; i++){
                        $scope.conversation.Messages.push(success[i]);
                    }
                },
                function(error){
                    console.log('Could not get older messages for conversation.')
                });
        }

        $scope.$on('messages-added', function(event, args) {

            var promise = messageRepository.getMessagesByTime(1, 1);
            promise.then(
                function(messages){
                    for (var i = 0; i < messages.length; i++){
                        for (var j = 0; j < $scope.conversations.length; j++){
                            if(messages[i].ConversationId === $scope.conversations[j].ConversationId){

                                var found = false;

                                for(var k = 0; k < $scope.conversations[j].Messages.length; k++){
                                    if($scope.conversations[j].Messages[k].MessageId === messages[i].MessageId){
                                        found = true;
                                    }
                                }

                                if(!found){
                                    $scope.conversations[j].Messages.push(messages[i]);
                                }

                            } else {
                                // new conversation
                                console.log('Message from new conversation!')
                            }
                        }
                    }
                },
                function(error){
                    console.log(error);
                });
        });

        $scope.sortMessage = function(message) {
            var date = new Date(message.CreatedOn);
            return date;
        };

        var fetchMessagesInterval = setInterval(function() {
            var oneMinuteAgo = new Date();
            oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
            var args = { Sender: "conversations", Event: 'sync last minute', PeriodStart: oneMinuteAgo.toJSON(), PeriodEnd: new Date().toJSON(), Index: 0, Size: 50 };
            $rootScope.$broadcast('download-messages', args);
        }, 50000);

        function init(){
            $scope.userId = tokenService.getAppUserId();
            $scope.appUsers = contactsService.getAppUsers();

            function setupConversation(id) {
                var conversation = { ConversationId: id, Messages: [], AuthorDisplayNames: [], AuthorIds: [] };

                var conversationMessagesPromise =
                    messageRepository.getMessagesByConversation(conversation.ConversationId, 0, 5);

                conversationMessagesPromise.then(
                    function (conversationMessagesSuccess){
                        conversation.Messages = conversationMessagesSuccess;

                        // Checks every message AuthorDisplayName & AuthorId, adds to conversation properties if does not already exist
                        for(var j = 0; j < conversation.Messages.length; j++){
                            if(conversation.AuthorDisplayNames.indexOf(conversation.Messages[j].AuthorDisplayName) === -1){
                                conversation.AuthorDisplayNames.push(conversation.Messages[j].AuthorDisplayName);
                            }

                            if(conversation.AuthorIds.indexOf(conversation.Messages[j].Author) === -1){
                                conversation.AuthorIds.push(conversation.Messages[j].Author);
                            }
                        }

                        $scope.conversation = conversation;
                    },
                    function(error){
                        console.log('Could not get messages for conversation.')
                    });
            }

            setupConversation($scope.conversationId);
        };
        init();

    }])