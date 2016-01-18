function MessagesController(apiFactory, $scope, $location, $routeParams, usersFactory, conversationsFactory, $timeout) {

    var conversationId = $routeParams.param1;

    $scope.successText = null;
    $scope.errorText = null;

    function showAlert(text,type,duration) {
        if (type == 'success') {
            $scope.successText = text;
            $timeout(function() {
                $scope.successText = null;
            }, duration);
        }
        if (type == 'error') {
            $scope.errorText = text;
            $timeout(function () {
                $scope.errorText = null;
            }, duration);
        }
        
    }

    function init() {
        if ($scope.authenticationToken == undefined) {
            $location.path('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/login');
        }
        listMessages($scope.authenticationToken, conversationId);
        $scope.conversation = conversationsFactory.getCurrentConversation();
        //console.log($scope.conversation);
    }

    function listMessages(token, conversationId) {
        
        var listMessagesRequest = {
            authenticationToken: $scope.authenticationToken,
            data: {
                'conversationId': conversationId,
                'sortAscending': false,
                'pageIndex': 1,
                'pageSize': 20
            }
        };
        apiFactory.functions.call('conversations/list-messages', listMessagesRequest, function (response) {
            $scope.messages = response.data.items;
            var markAsReadRequest = {
                authenticationToken: $scope.authenticationToken,
                data: {
                    'conversationId': conversationId
                }
            };
            apiFactory.functions.call('conversations/conversation-read', markAsReadRequest, function (response) {
                //console.log("Conversation is read: " + conversationId);
            });

        });
    }

    $scope.sendMessage = function (message) {
        console.log('Message: ' + message);
        if (message == null) {
            showAlert('No text in message', 'error', 1000);
        } else {

            $scope.newMessage = null;

            var sendTo = [];
            angular.copy($scope.conversation.participants, sendTo);
            sendTo.push($scope.conversation.userId);

            var sendMessageRequest = {
                authenticationToken: $scope.authenticationToken,
                data: {
                    'instanceName': apiFactory.apiSettings.instanceName,
                    'inboxId': $scope.conversation.inboxId,
                    'participants': sendTo,
                    'message': message
                }
            };
            //console.log(sendMessageRequest);
            apiFactory.functions.call('conversations/create-message', sendMessageRequest, function(response) {
                showAlert('Message sent', 'success', 1000);
                listMessages($scope.authenticationToken, conversationId);
            }, function(error) {
                showAlert('Message sent', 'error', 5000);
                console.log(error);
            });
        }

    };

    // handler
    var onNewMessages = function (event, newMessages) {
        //console.log("Current convId: " + conversationId + " = New convId: " + newMessages[0].conversationId);
        if (newMessages[0].conversationId == conversationId) {
            listMessages($scope.authenticationToken, conversationId);
            console.log("MC: New message in this conversation, update view");
        } else {
            showAlert("New message in other conversation", 'success', 5000);
            console.log("MC: New Message in other conversation");
        }
    }

    // start subscribing
    $scope.$on('newMessages', onNewMessages);

    init();
}