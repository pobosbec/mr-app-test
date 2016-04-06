/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('conversations', [])
    .controller('conversationsCtrl', ['$scope', '$http', '$rootScope', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', function($scope, $http, $rootScope, tokenService, contactsService, communicationService, messageRepository) {

        $scope.conversations = [];
        $scope.userId = null;
        $scope.appUsers = [];

        /* Make a request to the api to check if a conversation exists
         */
        $scope.doesConversationExist = function(users) {
            return communicationService.doesConversationExist(users);
        };

        /* Makes a request to the api to get messages between two dateTimes. Could be used in a syncing service
         * if the user has dropped the local database.
         */
        $scope.sync = function(from, to){
            communicationService.syncPeriodMessages(from.toJSON(), to.toJSON(), 0, 50);
        };

        /* Gets the url for a user. Used in an ng-repeat to display the avatar.
         */
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

        // The purpose of fetching messages in this controller is to be able to display that a new conversation has been started
        var fetchMessagesInterval = setInterval(function() {
            var oneMinuteAgo = new Date();
            oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
            communicationService.syncOnce(oneMinuteAgo.toJSON(), new Date().toJSON(), 0, 50);
        }, 50000);

        // The events that this view reacts on
        $scope.$on('messages-added', function(event, args) {

            var promise = messageRepository.getMessagesByTime(1, 5);
            promise.then(
                function(messages){
                    for (var i = 0; i < messages.length; i++){

                        var newConversation = true;

                        for (var j = 0; j < $scope.conversations.length; j++){
                            if(messages[i].ConversationId === $scope.conversations[j].ConversationId){

                                newConversation = false;
                                var found = false;

                                for(var k = 0; k < $scope.conversations[j].Messages.length; k++){
                                    if($scope.conversations[j].Messages[k].MessageId === messages[i].MessageId){
                                        found = true;
                                    }
                                }

                                if(!found){
                                    $scope.conversations[j].Messages.push(messages[i]);
                                }
                            }
                        }

                        if(newConversation === true){
                            var conversation = {
                                ConversationId: messages[i].conversationId,
                                Messages: [messages[i]],
                                AuthorDisplayNames: [messages[i]].authorDisplayName,
                                AuthorIds: [messages[i].author]
                            };

                            $scope.conversations.push(conversation);
                        }
                    }
                },
                function(error){
                    console.log(error);
                });
        });

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
        $scope.userId = null;
        $scope.conversation = [];

        /* Reply to the current conversation
         */
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

        /* Gets more messages for the current conversation
         */
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

        // The events that this view reacts on
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

        // This is required for ng-repeat order by date
        $scope.sortMessage = function(message) {
            var date = new Date(message.CreatedOn);
            return date;
        };

        // The purpose of fetching messages in this controller is to be able to display that a new conversation has been started
        var fetchMessagesInterval = setInterval(function() {
            var oneMinuteAgo = new Date();
            oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
            communicationService.syncOnce(oneMinuteAgo.toJSON(), new Date().toJSON(), 0, 50);
        }, 50000);

        /*
         var fetchMessagesInterval = setInterval(function() {
         var oneMinuteAgo = new Date();
         oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
         var args = { Sender: "conversations", Event: 'sync last minute', PeriodStart: oneMinuteAgo.toJSON(), PeriodEnd: new Date().toJSON(), Index: 0, Size: 50 };
         $rootScope.$broadcast('download-messages', args);
         }, 50000);
         */
        /* Sets initial values and fetches a limited number of messages for the current conversation
         */
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