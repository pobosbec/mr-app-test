mrApp.controller('ConversationsController',[
    'ApiFactory', '$scope', '$rootScope', '$location', '$routeParams', 'UsersFactory', 'ConversationsFactory',
    function(apiFactory, $scope, $rootscope, $location, $routeParams, usersFactory, conversationsFactory) {

        var inboxId = $routeParams.param1;

        $scope.alertText = null;

        function init() {
            $scope.$emit('viewChanged', 'conversations');
            $rootscope.currentInboxId = inboxId;
            listConversations(apiFactory.getToken(), inboxId);
        }

        function listConversations(token, inboxId) {
            conversationsFactory.listConversations(token,
                inboxId,
                function(conversations) {
                    $scope.conversations = conversations;
                    $scope.$emit('showAlertNewMessage', false);
                },
                function(error) {
                    console.log(error);
                });
        }

        $scope.ListMessagesInConversation = function(conversation) {
            //console.log(conversation);
            conversationsFactory.setCurrentConversation(conversation);
            $location.path('/messages/' + conversation.itemId);
        };

        // handler
        var onNewMessages = function(event, messages) {
            //console.log("CC: Handle new message event");
            listConversations(apiFactory.getToken(), inboxId);
        }

        // start subscribing
        $scope.$on('newMessages', onNewMessages);

        init();
    }
]);

