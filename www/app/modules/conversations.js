/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('conversations', [])
    .controller('conversationsCtrl', ['$scope', '$http', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', function($scope, $http, tokenService, contactsService, communicationService, messageRepository) {

        $scope.conversations = [];
        $scope.messages = [];
        $scope.currentConversation = { ConversationId: {}, Messages: [], AuthorDisplayNames: [], UserIds: [] };
        $scope.currentReplyMessage = "";

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

            var newMessage = { Content: message, Status: 'pending', Id: 'test' };

            $scope.messages.push(newMessage);

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

        $scope.replyMessages = [];

        $scope.clearReplyMessages = function(){
            $scope.replyMessages = [];
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

        function init(){
            $scope.messages = messageRepository.getMessages();

            if($scope.messages.length === 0){
                return;
            }

            var conversationsIds = [];

            var latestActiveConversation = $scope.messages[0];

            for (var k = 0; k < $scope.messages.length; k++){

                if($scope.messages[k].CreatedOn > latestActiveConversation.CreatedOn){
                    latestActiveConversation = $scope.messages[k];
                }

                if(conversationsIds.indexOf($scope.messages[k].ConversationId) === -1){
                    conversationsIds.push($scope.messages[k].ConversationId);
                }
            }

            for(var i = 0; i < conversationsIds.length; i++){
                $scope.conversations.push($scope.orderConversation(conversationsIds[i]));
                $scope.replyMessages.push({ ConversationId: conversationsIds[i], ReplyMessage: null});
            }

            for(var j = 0; j < $scope.conversations.length; j++){
                if($scope.conversations[j].ConversationId === latestActiveConversation.ConversationId){
                    $scope.selectConversation($scope.conversations[j]);
                    j = $scope.conversations.length;
                }
            }
        };
        init();

    }])