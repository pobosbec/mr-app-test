/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('event', [])
    .controller('eventCtrl', ['$scope', '$rootScope', '$location', '$http', 'tokenService', 'communicationService', 'messageRepository', 'contactsService', 'dataService', 'databaseService', 'logService', function ($scope, $rootScope, $location, $http, tokenService, communicationService, messageRepository, contactsService, dataService, databaseService, logService) {

        $scope.deviceReady = true;
        $scope.isPhoneGap = window.isPhoneGap;

        // ------------------------------------
        // PhoneGap/Cordova events
        // ------------------------------------

        document.addEventListener("deviceready", function() {
            // Your code here...
            logService.log("Device Ready");
        });

        // Native
        document.addEventListener('resume', function (event, args) {
            logService.log("resume");
            logService.log("initing plugin with on device ready, events.js");

         //   dataService.quickLoading = false;

            //hotfix
            var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");
            pushNotification.onDeviceReady({ pw_appid: "A014B-AC83E" });
            logService.log("set app badge nr 0");
            pushNotification.setApplicationIconBadgeNumber(0);
            $rootScope.$broadcast('on-focus', args);
        }, false);

        //iOS specific version of resume
        //document.addEventListener('active', function (event, args) {
        //    logService.log("active");
        //}, false);

        document.addEventListener('pause', function (event, args) {
            logService.log("pause");
            $rootScope.$broadcast('on-blur', args);
        }, false);

        //iOS specific version of pause
        //document.addEventListener('resign', function (event, args) {
        //    logService.log("resign");
        //}, false);

        document.addEventListener('online', function (event, args) {
            $rootScope.$broadcast('online', args);
            logService.log(new LogObject("Online"));
        }, false);

        document.addEventListener('offline', function (event, args) {
            $rootScope.$broadcast('offline', args);
        }, false);

        document.addEventListener('backbutton', function (event, args) {
            $rootScope.$broadcast('back-button', args);
        }, false);

        document.addEventListener('menubutton', function (event, args) {
            $rootScope.$broadcast('menu-button', args);
        }, false);

        document.addEventListener('push-service-initialized', function (event, args) {
            logService.log("push-service-initialized events.js");
            $rootScope.$broadcast('push-service-initialized', event);
        }, false);

        document.addEventListener('push-notification', function (event, args) {
            logService.log("push-notification, events.js");

            // TODO: fix code smell..
            var notificationConversations = JSON.parse(localStorage.getItem("pushConversations"));

            if (notificationConversations != null) {
                if (notificationConversations.constructor === Array) {
                    if (event.notification.userdata.c != null) {
                        notificationConversations.push(event.notification.userdata.c);
                        localStorage.setItem("pushConversations", JSON.stringify(notificationConversations));
                    }
                } else {
                    if (event.notification.userdata.c != null) {
                        var arr = [];
                        arr.push(event.notification.userdata.c);
                        localStorage.setItem("pushConversations", JSON.stringify(arr));
                    }
                }
            } else {
                notificationConversations = [];
                if (event.notification.userdata.c != null) {
                    notificationConversations.push(event.notification.userdata.c);
                    localStorage.setItem("pushConversations", JSON.stringify(notificationConversations));
                }
            }
            $rootScope.$broadcast('push-notification', event);
            $rootScope.$broadcast('on-focus', event);
        }, false);

        // Wrapped
        $scope.$on('on-focus', function (event, args) {
            logService.log("on-focus");

            databaseService.init().then(function () {
                contactsService.setDb();
                messageRepository.init();
                logService.setDb();
                $rootScope.$broadcast('services-started');
            });

            dataService.quickLoad();

            var onFocusDelay = setTimeout(function (event, args) {
                args = args | {};
                args.Sender = 'events';
                args.Event = 'on-focus';

                // TODO: this smells.

                function resetData() {
                    var conversationIds = [];
                    localStorage.setItem("pushConversations", JSON.stringify(conversationIds));
                }

                var conversationIds = JSON.parse(localStorage.getItem("pushConversations"));

                if (conversationIds === null || conversationIds === undefined) {
                    resetData();
                    return;
                } else {
                    // TODO: what if several elements contain same conversationId
                    if (conversationIds.constructor === Array) {
                        if (conversationIds.length === 1) {
                            var convoId = conversationIds[0];
                            resetData();
                            dataService.conversations.some(function (conversation) {
                                if (conversation.ConversationId === convoId) {
                                    dataService.syncConversation(conversation);
                                }
                            });
                            $location.path('/conversation/' + convoId);
                        } else if (conversationIds.length > 1) {

                            dataService.conversations.some(function (conversation) {
                                conversationIds.some(function (id) {
                                    if (conversation.ConversationId === id) {
                                        dataService.syncConversation(conversation);
                                    }
                                });
                            });

                            var sameConversation = false;

                            var firstConversationId = conversationIds[0];

                            for (var i = 1; i < conversationIds.length; i++) {
                                if (conversationIds[i] === firstConversationId) {
                                    sameConversation = true;
                                    break;
                                }
                            }

                            resetData();
                            if (sameConversation) {
                                $location.path('/conversation/' + firstConversationId);
                            } else {
                                $location.path('/conversations/');
                            }
                        }
                    } else {
                        resetData();
                        return;
                    }
                }

                setTimeout(function () {
                    $rootScope.$broadcast('sync-conversation-in-view', event);
                }, 10);
            }, 10);
        });

        $scope.$on('on-blur', function (event, args) {

        });

        $scope.$on('online', function (event, args) {
        });

        $scope.$on('offline', function (event, args) { });

        $scope.$on('database-error', function(event, args) {
            logService.info('Received database-error. Reconnecting db.');
            databaseService.init().then(
                function(success) {
                    logService.info('Database restarted.');
                    contactsService.setDb();
                    messageRepository.init();
                    logService.setDb();
                },
                function(error) {
                    logService.info('Could not restart database.');
                });
        });

        $scope.$on('back-button', function (event, args) {
            if (event != null) {
                if (event.preventDefault) {
                    event.preventDefault();
                }
            }

            if ($scope.deviceReady) {
                if (($location.path() === '/home' || $location.path() === '/login') && !$scope.isIOS) {
                    if ($scope.isPhoneGap) {
                        navigator.notification.confirm("Exit application?", function (exit) {
                            if (exit == 1) {
                                $rootScope.$broadcast('app-exit');
                                navigator.app.exitApp();
                            } else {
                                return;
                            }
                            return;
                        });
                    } else {
                        var exit = window.confirm("Exit application?");
                        if (exit == 1) {
                            $rootScope.$broadcast('app-exit');
                        } else {
                            return;
                        }
                        return;
                    }
                } else {
                    window.history.back();
                    return;
                }
            } else {
                logService.log('back pressed before device-ready');
            }
        });

        $scope.$on('menu-button', function (event, args) { });

        $scope.$on('push-service-initialized', function (event, args) {
            logService.log("Push-service-initialized event");
            tokenService.registerPushToken();
        });

        $scope.$on('push-notification', function (event, args) {
            communicationService.on(event, args);
            logService.log("$on, push-notification, event.js 249: " + event);

        });

        // ------------------------------------
        // Version Events 
        // ------------------------------------

        // Native

        document.addEventListener('version-information', function (event, args) {
            $rootScope.$broadcast('version-information', event);
        }, false);

        // Wrapped

        $scope.$on('version-information', function (event, args) {
            $rootScope.version = args.detail;
            //if (!version.upToDate) {
            //    logService.warn("\n    A newer version of mr-app is available, please update. ("+version.local.fullVersion+" > "+version.remote.fullVersion+") \n ");
            //}
        });

        // ------------------------------------
        // Browser specific events 
        // ------------------------------------

        // Native
        if (window.addEventListener) {
            window.addEventListener('load', function (event, args) {
                $rootScope.$broadcast('load', args);
            }, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", function (event, args) {
                $rootScope.$broadcast('load', args);
            });
        }


        // Wrapped
        $scope.$on('load', function (event, args) {
            //$rootScope.$broadcast('sync-conversations', args);
        });


        // ------------------------------------
        // Application events 
        // ------------------------------------
        $scope.$on('logged-in', function (event, args) {

            logService.logMessage("Event.. logged-in");

            if ($scope.isPhoneGap) {
                logService.log("device isPhoneGap -> initPushwoosh() in index.js");
                $rootScope.$broadcast('push-service-initialized', event);
            }
            databaseService.on(event, args).then(function (success) {
                logService.info('Database service inititated.');
                dataService.on(event, args);
                communicationService.on(event, args);
            }, function (error) {
                logService.error(error);
            });
        });

        $scope.$on('logged-out', function (event, args) {
            messageRepository.on(event, args);
            contactsService.on(event, args);
            dataService.on(event, args);
            databaseService.on(event, args);
        });

        $scope.$on('app-token-available', function (event, args) {
            // Here we need to do the initial sync
        });

        $scope.$on('push-token-registered', function (event, args) {
        });

        $scope.$on('slow-http-request-detected', function (event, args) {
            logService.warn(new LogObject('slow-http-request-detected: ' + args.url + ' (' + args.elapsedTime + ' ms)'));
            $rootScope.slowConnection = true;
            clearTimeout($scope.slowConnectionResetTimer);
            $scope.slowConnectionResetTimer = setTimeout(function () { $rootScope.slowConnection = false; }, 3000);
        });

        // ------------------------------------
        // Factory-forwarded events 
        // ------------------------------------
        $scope.$on('new-messages', function (event, args) {
            messageRepository.on(event, args);
        });

        $scope.$on('new-conversations', function (event, args) {
            messageRepository.on(event, args);
        });

        $scope.$on('updated-message', function (event, args) {
            messageRepository.on(event, args);
        });

        $scope.$on('services-started', function (event, args) {
            dataService.on(event, args);
        });

        $scope.$on('download-messages', function (event, args) {
            communicationService.on(event, args);
        });

        $scope.$on('messages-added', function (event, args) {
            dataService.on(event, args);
        });

        // ------------------------------------
        // Log/debug events 
        // ------------------------------------
    }]);