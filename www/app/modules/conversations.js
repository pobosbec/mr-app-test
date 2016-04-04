/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('conversations', [])
    .controller('conversationsCtrl', ['$scope', '$http', '$rootScope', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', function($scope, $http, $rootScope, tokenService, contactsService, communicationService, messageRepository) {

        $scope.conversations = [];
        $scope.userId = null;
        $scope.appUsers = [];

        $scope.findConversationIndex = function(conversationId){
            for(var i = 0; i < $scope.conversations.length; i++){
                if($scope.conversations[i].ConversationId === conversationId){
                    return i;
                }
            }

            return -1;
        }

        $scope.doesConversationExist = function(users) {
            return communicationService.doesConversationExist(users);
        };

        $scope.selectConversation = function(conversation){
            $scope.switchReplyMessage(conversation);
            for (var i = 0; i < $scope.conversations.length; i++){
                if($scope.conversations[i].ConversationId === conversation.ConversationId){
                    $scope.currentConversation = $scope.conversations[i];
                }
            }
        }

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

            var newMessage = { Content: message, Status: 'pending', Id: 'test' };

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
                    // Remove temp message from messages array, use MessageId to get message from messageRepository

                },
                function(error){
                    console.log('Could not reply to conversation.')

                });
        }

        $scope.clearReplyMessages = function(){
            $scope.currentReplyMessage = "";
        }

        $scope.switchReplyMessage = function(conversation){
            for (var i = 0; i < $scope.replyMessages.length; i++){
                if($scope.replyMessages[i].ConversationId === conversation.ConversationId){
                    $scope.currentReplyMessage = $scope.replyMessages[i].ReplyMessage;
                }
            }
        }

        $scope.captureReplyMessageInput = function (conversationId, input) {
            for (var i = 0; i < $scope.replyMessages.length; i++){
                if($scope.replyMessages[i].ConversationId === conversationId){
                    $scope.replyMessages[i].ReplyMessage = input;
                }
            }
        }

        var fetchMessagesInterval = setInterval(function() {
            var args = { Sender: "messages", Event: 'interval' };
            $rootScope.$broadcast('download-whats-new', args);
            console.log("10s whats-new");
        }, 20000);

        function init(){
            $scope.userId = tokenService.getAppUserId();
            $scope.appUsers = contactsService.getAppUsers();
            var existingConversationsIdsPromise = messageRepository.getConversations(0, 100);

            existingConversationsIdsPromise.then(
                function(existingConversationsSuccess){
                    for(var i = 0; i < existingConversationsSuccess.length; i++){

                        setupConversation(existingConversationsSuccess[i]);

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

            var newMessage = { Content: message, Status: 'pending', Id: 'test' };

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
                    // Remove temp message from messages array, use MessageId to get message from messageRepository

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

        $scope.loadMoreForConversation = function(conversationId){

            var index = $scope.findConversationIndex(conversationId);

            var promise = messageRepository.getMessagesByConversation(
                conversationId,
                $scope.conversations[index].Messages.length,
                3);

            promise.then(
                function(success){
                    for(var i = 0; i < success.length; i++){
                        $scope.conversations[$scope.findConversationIndex(conversationId)].Messages.push(success[i]);
                    }
                },
                function(error){

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

        var fetchMessagesInterval = setInterval(function() {
            var args = { Sender: "messages", Event: 'interval' };
            $rootScope.$broadcast('download-whats-new', args);
            console.log("10s whats-new");
        }, 20000);

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