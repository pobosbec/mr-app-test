/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('conversations', [])
    .controller('conversationsCtrl', ['$scope', '$http', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', function($scope, $http, tokenService, contactsService, communicationService, messageRepository) {

        $scope.conversations = [];
        $scope.messages = [];
        $scope.currentConversation = { ConversationId: {}, Messages: [], AuthorDisplayNames: [], UserIds: [] };
        
        $scope.doesConversationExist = function(users) {
            return communicationService.doesConversationExist(users);
        };

        $scope.selectConversation = function(conversation){
            /*$scope.currentConversation.Messages = [];
            $scope.currentConversation.AuthorDisplayNames = [];
            $scope.currentConversation.UserIds = [];
            $scope.currentConversation.ConversationId = conversationId;
            console.log('Selected conversation: ' + conversationId);

            for (var k = 0; k < $scope.messages.length; k++){
                if($scope.messages[k].ConversationId === $scope.currentConversation.ConversationId){
                    $scope.currentConversation.Messages.push($scope.messages[k]);

                    if($scope.currentConversation.AuthorDisplayNames.indexOf($scope.messages[k].AuthorDisplayName) === -1){
                        $scope.currentConversation.AuthorDisplayNames.push($scope.messages[k].AuthorDisplayName);
                    }

                    if($scope.currentConversation.UserIds.indexOf($scope.messages[k].Author) === -1){
                        $scope.currentConversation.UserIds.push($scope.messages[k].Author);
                    }
                }
            }*/
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

            var newMessage = { Content: message, Status: 'pending'};

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
                    console.log('Replied to conversation!')
                    $scope.newMessage.status = 'success';
                },
                function(error){
                    console.log('Could not reply to conversation.')
                    $scope.newMessage.status = 'failed';
                });
        }

        function init(){
            /*for (var j = 0; j < $scope.appUsers.length; j++){
                var promise = $scope.doesConversationExist(new Array($scope.appUsers[j].userId));

                promise.then(function(success) {
                    var conversationData = { ConversationId: success.data, Participants: $scope.appUsers[j].userId};
                    $scope.conversations.push(conversationData);
                }, function(reason) {
                    alert('Failed: ' + reason);
                });
            }*/

            $scope.messages = messageRepository.getMessages();

            var conversationsIds = [];

            for (var k = 0; k < $scope.messages.length; k++){
                if(conversationsIds.indexOf($scope.messages[k].ConversationId) === -1){
                    conversationsIds.push($scope.messages[k].ConversationId);
                }
            }

            // now we have all the conversations ids
            for(var i = 0; i < conversationsIds.length; i++){
                $scope.conversations.push($scope.orderConversation(conversationsIds[i]));
            }
        };
        init();

    }])