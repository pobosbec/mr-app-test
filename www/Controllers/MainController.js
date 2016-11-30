﻿mrApp.controller('MainController', [
    'ApiFactory','$rootScope', '$scope', '$location', '$filter', '$timeout', 'ConversationsFactory',
    function(apiFactory, $rootScope, $scope, $location, $filter, $timeout, conversationsFactory) {

        $scope.alertNewMessage = false;
        
        var checkWhatsNew = function() {
            conversationsFactory.whatIsNew(function(messages) {
                    //console.log(apiFactory.lastCallTimestamp());
                    if (messages != null && messages.length > 0) {
                        //BROADCAST
                        $scope.$broadcast('newMessages', messages);
                    }
                    //$timeout(function() {
                    //        checkWhatsNew();
                    //    },
                    //    5000);
                },
                function(error) {
                    console.log("What-is-new:");
                    console.log(error);
                });
        };

        function onShowAlertNewMessage(event, state) {
            $scope.alertNewMessage = state;
        }

        // start subscribing
        $scope.$on('showAlertNewMessage', onShowAlertNewMessage);

        function onNewPush(event, state) {
            console.log("Handle:newPush");
            console.log(event);
            console.log(state);
            //alert("[PUSH] Message: " + state.message);

            //    push.message
            //alert("[PUSH] Message: " +
            //    push.message +
            //    ", Conversation: " +
            //    push.userdata.c +
            //    ", Inbox: " +
            //    push.userdata.i +
            //    ", Sender: " +
            //    push.userdata.s);
            //console.log(push);

            checkWhatsNew();
        }

        function onResume(event, state) {
            //alert("Resumed");
            //onViewLoaded();
            checkWhatsNew();
        }

        function onHttpCallError(event, state) {
            console.log(event);
            console.log(state);
            alert("httpCallError: " + state);
        }

        function onHttpUnauthorized(event, state) {
            console.log(event);
            console.log(state);
            alert("httpUnauthorized: " + state);
            $location.path('/login/');
        }

        $scope.$on('newPush', onNewPush);

        $scope.$on('appResumed', onResume);

        $scope.$on('httpCallError', onHttpCallError);

        $scope.$on('httpUnauthorized', onHttpUnauthorized);

        function onViewLoaded() {
            //var token = $rootScope.authenticationToken;
            var token = apiFactory.authenticationToken();

            if (token != undefined) {

                if ($scope.inboxes == undefined) {

                    listInboxes(token,
                        function (response) {

                            getInbox(token,
                                $scope.inboxes[0].inboxId,
                                function (response) {
                                    if ($scope.inboxes[0].inboxId != undefined) {
                                        $location.path('/conversations/' + $scope.inboxes[0].inboxId);
                                    }
                                });
                            checkWhatsNew();
                        });

                }
            }
        }

        $scope.$on('$viewContentLoaded', onViewLoaded);

        $rootScope.validateLoad = function(part) {
            if (part == 'inboxes') {
                if ($scope.inboxes != undefined) {
                    return true;
                }
            } else if (part == 'inbox') {
                if ($scope.inbox != undefined) {
                    return true;
                }
            } else if (part == 'profile') {
                if ($rootScope.myAppUser != undefined) {
                    return true;
                }
            } else if (part == 'logout') {
                if ($rootScope.authenticationToken != undefined) {
                    return true;
                }
            } else if (part == 'newConversation') {
                if ($rootScope.authenticationToken != undefined) {
                    return true;
                }
            }

            return false;
        };

        function listInboxes(token, callback) {

            var listInboxesRequest = {
                authenticationToken: token,
                data: {
                    'pageIndex': 0,
                    'pageSize': 10
                }
            };
            apiFactory.functions.call('inboxes/list',
                listInboxesRequest,
                function (response) {
                    $scope.inboxes = response.data.items;
                    callback(response);
                },
                function(error) {

                });

        }

        function getInbox(token, inboxId, callback) {

            var getInboxRequest = {
                authenticationToken: token,
                data: {
                    'inboxId': inboxId
                }
            };
            apiFactory.functions.call('inboxes/details',
                getInboxRequest,
                function(response) {
                    $scope.inbox = response.data;
                    callback();
                });

        }

    }
]);
