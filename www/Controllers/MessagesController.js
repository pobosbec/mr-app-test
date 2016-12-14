mrApp.directive('iframeOnload',
[
    function() {
        return {
            scope: {
                callBack: '&iframeOnload'
            },
            link: function(scope, element, attrs) {
                element.on('load',
                    function() {
                        return scope.callBack();
                    });
            }
        }
    }
]);

mrApp.controller('FormModalController',
[
    '$scope','$timeout', 'SharedState',
    function($scope,$timeout, SharedState) {

        $scope.activeFormUrl = "Partials/loading.htm";

        function loadIframe() {
            console.log("iFrameLoaded");
            $scope.activeFormUrl = SharedState.get('formModalUrl');
        }

        $scope.iframeLoadedCallBack = function() {
            

        }

        function init() {
            console.log("Init: " + SharedState.get('formModalUrl'));
            $timeout(function () {
                loadIframe();
            },
                1000);
        }

        init();

    }
]);

mrApp.controller('MessagesController', [
    'ApiFactory', '$scope', '$location', '$routeParams', 'UsersFactory', 'ConversationsFactory', '$timeout', '$filter','SharedState','SettingsFactory',
    function(apiFactory, $scope, $location, $routeParams, usersFactory, conversationsFactory, $timeout, $filter, SharedState, settingsFactory) {

        var conversationId = $routeParams.param1;

        $scope.successText = null;
        $scope.errorText = null;

        $scope.activeFormUrl = '';

        $scope.openFormModal = function (formId) {
            var formUrl = 'http://m.mobileresponse.se/form/' + formId;
            //console.log(formUrl);
            SharedState.set('formModalUrl', formUrl);
            SharedState.turnOn('formModal');
        };

        function showAlert(text, type, duration) {
            if (type === 'success') {
                $scope.successText = text;
                $timeout(function () {
                    $scope.successText = null;
                }, duration);
            }
            if (type === 'error') {
                $scope.errorText = text;
                $timeout(function () {
                    $scope.errorText = null;
                }, duration);
            }

        }

        function init() {
            
            if ($scope.authenticationToken == undefined) {
                $location.path('/login');
            }
            listMessages($scope.authenticationToken, conversationId);
            $scope.conversation = conversationsFactory.getCurrentConversation();

            SharedState.initialize($scope, 'formModalUrl', '');

            //$scope.$emit('inConversation', { 'state': true });
            $scope.$emit('viewChanged', 'conversation');
        }

        function linkify(text) {
            var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            return text.replace(urlRegex, function (url) {
                return '<a href="' + url + '" target="_blank">' + url + '</a>';
            });
        }

        function parseAuthor(messages) {
            for (var i = 0; i < messages.length; i++) {
                if (angular.equals(messages[i].authorId, usersFactory.myUser().id)) {
                    messages[i].author = "me";
                } else {
                    messages[i].author = "other";
                }
            }
            return messages;
        }
        
        function listMessages(token, conversationId) {

            var listMessagesRequest = {
                authenticationToken: $scope.authenticationToken,
                data: {
                    'conversationId': conversationId,
                    'sortAscending': false,
                    'pageIndex': 1,
                    'pageSize': settingsFactory.getNumberOfMessages()
                }
            };
            console.log(listMessagesRequest);
            apiFactory.functions.call('conversations/list-messages', listMessagesRequest, function (response) {

                for (var i = 0; i < response.data.items.length; i++) {
                    response.data.items[i].content = linkify(response.data.items[i].content);
                    if (response.data.items[i].metaData.length > 0) {
                        if (response.data.items[i].metaData[0]._type === "form") {
                            var formObj = angular.fromJson(response.data.items[i].metaData[0].value);
                            response.data.items[i].formId = formObj.id;
                        }
                    }
                }

                response.data.items = parseAuthor(response.data.items);
                $scope.messages = response.data.items;

                scrollToLast();

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
        
        function scrollToLast() {
            // TODO: add $watch last-message instead
            $timeout(function () {
                    var elem = angular.element(document.getElementById('chat-container'));
                    var scrollableContentController = elem.controller('scrollableContent');
                    scrollableContentController.scrollTo(angular.element(document.getElementById('last-message')));
                },
                400);
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

                //var sendMessageRequest = {
                //    authenticationToken: $scope.authenticationToken,
                //    data: {
                //        'instanceName': apiFactory.apiSettings.instanceName,
                //        'inboxId': $scope.conversation.inboxId,
                //        'participants': sendTo,
                //        'message': message
                //    }
                //};
                ////console.log(sendMessageRequest);
                //apiFactory.functions.call('conversations/create-message', sendMessageRequest, function(response) {
                //    showAlert('Message sent', 'success', 1000);
                //    listMessages($scope.authenticationToken, conversationId);
                //}, function(error) {
                //    showAlert('Message sent', 'error', 5000);
                //    console.log(error);
                //});

                var replyRequest = {
                    authenticationToken: $scope.authenticationToken,
                    data: {
                        'conversationId': conversationId,
                        'message': message,
                        'metadata': {}
                    }
                };
                //console.log(replyRequest);
                apiFactory.functions.call('conversations/reply', replyRequest, function (response) {
                    showAlert('Message sent', 'success', 1000);
                    listMessages($scope.authenticationToken, conversationId);
                }, function (error) {
                    showAlert('Message sent', 'error', 5000);
                    console.log(error);
                });

            }

        };

        // handler
        var onNewMessages = function (event, newMessages) {
            var reload = false;
            var foundConversations = $filter('filter')(newMessages, { conversationId: conversationId }, true);
            if (foundConversations.length > 0) {
                for (var i = 0; i < newMessages.length && !reload; i++) {
                    var foundMessage = $filter('filter')($scope.messages, { messageId: newMessages[i].messageId }, true);
                    if (foundMessage.length === 0) {
                        reload = true;
                    }
                }
            }
            if (reload) {
                listMessages($scope.authenticationToken, conversationId);
            }
            if (foundConversations.length === 0 && newMessages.length > 0) {
                $scope.$emit('showAlertNewMessage', true);
            }
        }

        // start subscribing
        $scope.$on('newMessages', onNewMessages);

        init();
    }
]);

