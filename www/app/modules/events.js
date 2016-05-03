/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('event', [])
    .controller('eventCtrl', ['$scope', '$rootScope', '$location', '$http', 'tokenService', 'communicationService', 'messageRepository', 'contactsService', '$location', function ($scope, $rootScope, $location, $http, tokenService, communicationService, messageRepository, contactsService, $location) {

        $scope.deviceReady = true;
        $scope.isPhoneGap = window.isPhoneGap;

        if ($scope.isPhoneGap) {
            console.log("initPushwoosh");
            initPushwoosh();
        }

        // ------------------------------------
        // PhoneGap/Cordova events
        // ------------------------------------

        // Native
        document.addEventListener('resume', function (event, args) {
            $rootScope.$broadcast('on-focus', args);
        }, false);

        document.addEventListener('active', function (event, args) {
            $rootScope.$broadcast('on-focus', args);
        }, false);

        document.addEventListener('pause', function (event, args) {
            $rootScope.$broadcast('on-blur', args);
        }, false);

        document.addEventListener('resign', function (event, args) {
            $rootScope.$broadcast('on-blur', args);
        }, false);

        document.addEventListener('online', function (event, args) {
            $rootScope.$broadcast('online', args);
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
            $rootScope.$broadcast('push-service-initialized', event);
        }, false);

        document.addEventListener('push-notification', function (event, args) {
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
        }, false);



        // Wrapped
        $scope.$on('on-focus', function (event, args) {
            var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");
            pushNotification.setApplicationIconBadgeNumber(0);
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
                    if (conversationIds.constructor === Array) {
                        if (conversationIds.length === 1) {
                            var convoId = conversationIds[0];
                            resetData();
                            $location.path('/conversation/' + convoId);
                        } else if (conversationIds.length > 1) {
                            resetData();
                            $location.path('/conversation/');
                        }
                    } else {
                        resetData();
                        return;
                    }
                }
            }, 10);
        });

        $scope.$on('on-blur', function (event, args) { });

        $scope.$on('online', function (event, args) {
            args.Sender = 'events';
            args.Event = 'online';
        });

        $scope.$on('offline', function (event, args) { });

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
                console.log('back pressed before device-ready');
            }
        });

        $scope.$on('menu-button', function (event, args) { });

        $scope.$on('push-service-initialized', function (event, args) {
            console.log("Push service initialized: " + tokenService.getPushToken());
        });

        $scope.$on('push-notification', function (event, args) {
            communicationService.on(event, args);
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
            //    console.warn("\n    A newer version of mr-app is available, please update. ("+version.local.fullVersion+" > "+version.remote.fullVersion+") \n ");
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
        $scope.$on('load', function(event, args) {
            console.log('load!');
        });


        // ------------------------------------
        // Application events 
        // ------------------------------------

        $scope.$on('logged-in', function (event, args) {
            if ($scope.isPhoneGap) {
                tokenService.registerPushToken();
            }
            messageRepository.on(event, args);
            communicationService.on(event, args);
            contactsService.on(event, args);
        });

        $scope.$on('logged-out', function (event, args) {
            messageRepository.on(event, args);
            communicationService.on(event, args);
            contactsService.on(event, args);
        });

        $scope.$on('app-token-available', function (event, args) {
            // Here we need to do the initial sync
        });


        $scope.$on('push-token-registered', function (event, args) {
            console.log('push-token-registered');
        });

        $scope.$on('slow-http-request-detected', function (event, args) {
            console.warn('slow-http-request-detected: ' + args.url + ' (' + args.elapsedTime + ' ms)');
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

        $scope.$on('download-conversation-messages', function (event, args) {
            communicationService.on(event, args);
        });

        $scope.$on('download-messages', function (event, args) {
            communicationService.on(event, args);
        });
    }]);