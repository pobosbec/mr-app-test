mrApp.controller('MainController', [
    'ApiFactory','$rootScope', '$scope', '$location', '$filter', '$timeout', 'ConversationsFactory','DeviceFactory',
    function(apiFactory, $rootScope, $scope, $location, $filter, $timeout, conversationsFactory, deviceFactory) {

        $scope.inConversation = false;
        $scope.currentView = 'main';
        
        $scope.alertNewMessage = false;
        $scope.alertLoading = false;
        $scope.deviceType = 0;

        
        var checkWhatsNew = function() {
            conversationsFactory.whatIsNew(function(messages) {
                    //console.log(apiFactory.lastCallTimestamp());
                    if (messages != null && messages.length > 0) {
                        //BROADCAST
                        $scope.$broadcast('newMessages', messages);
                    }
                    //console.log("isDevice: " + deviceFactory.isDevice());
                    if (!deviceFactory.isDevice()) {
                        $timeout(function() {
                                checkWhatsNew();
                            },
                            5000);
                    }
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
            checkWhatsNew();
        }

        function onResume(event, state) {
            checkWhatsNew();
        }

        function onHttpCallError(event, state) {
            console.log(event);
            console.log(state);
            //alert("httpCallError: " + state);
        }

        function onHttpUnauthorized(event, state) {
            //console.log(event);
            //console.log(state);
            //alert("httpUnauthorized: " + state);
            $location.path('/login/');
        }

        function onLoading(event, state) {
            // TODO: detect slow loading, show info banner/modal after X sec
            $scope.alertLoading = state;
            //console.log("loading: " + state);
        }
        
        function onViewChanged(event, currentViewName) {
            $scope.currentView = currentViewName;
            //console.log($scope.currentView);
        }

        $scope.$on('loading', onLoading);

        $scope.$on('newPush', onNewPush);

        $scope.$on('appResumed', onResume);

        $scope.$on('httpCallError', onHttpCallError);

        $scope.$on('httpUnauthorized', onHttpUnauthorized);
        
        $scope.$on('viewChanged', onViewChanged);

        $scope.hideConversation = function () {
            $scope.currentView = 'conversations';
        };
        
        function onViewLoaded() {

            $scope.deviceType = deviceFactory.getDeviceTypeId();
            
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
