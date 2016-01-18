function ConversationsController(
    apiFactory,
    $scope,
    $rootscope,
    $location,
    $routeParams,
    usersFactory,
    conversationsFactory,
    $filter,
    $timeout) {

    var inboxId = $routeParams.param1;

    $scope.alertText = null;
   
    function init() {
        $rootscope.currentInboxId = inboxId;
        listConversations(apiFactory.getToken(), inboxId);
    }

    function listConversations(token, inboxId) {
        conversationsFactory.listConversations(token, inboxId, function(conversations) {
            $scope.conversations = conversations;
        }, function(error) {
            console.log(error);
        });
    }

    $scope.ListMessagesInConversation = function(conversation) {
        //console.log(conversation);
        conversationsFactory.setCurrentConversation(conversation);
        $location.path('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/messages/' + conversation.itemId);
    };

    // handler
    var onNewMessages = function (event, messages) {
        //console.log("CC: Handle new message event");
        listConversations(apiFactory.getToken(), inboxId);
    }

    // start subscribing
    $scope.$on('newMessages', onNewMessages);

    init();
}

