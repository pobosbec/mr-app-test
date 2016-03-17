/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('event', [])
    .controller('eventCtrl', ['$scope', '$rootScope', '$location', '$http', 'tokenService', 'communicationService', 'messageRepository', function ($scope, $rootScope, $location, $http, tokenService, communicationService, messageRepository) {

        $scope.deviceReady = false;
        $scope.isPhoneGap = window.isPhoneGap;
        // ------------------------------------
        // PhoneGap/Cordova events
        // ------------------------------------

        // Native
        document.addEventListener('deviceready', function (event, args) {
            $rootScope.$broadcast('device-ready', args);
        }, false);

        document.addEventListener('resume', function (event, args) {
            $rootScope.$broadcast('on-focus', args);
        }, false);

        document.addEventListener('pause', function (event, args) {
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
            $rootScope.$broadcast('push-notification', event);
        }, false);



        // Wrapped
        $scope.$on('device-ready', function (event, args) {
            console.log('device-ready');
            if (!$scope.deviceReady) {
                console.log("initPushwoosh");
                initPushwoosh();
            }
            $scope.deviceReady = true;

            messageRepository.on(event, args);
        });

        $scope.$on('on-focus', function (event, args) {
            $rootScope.$broadcast('download-whats-new', args);
        });

        $scope.$on('on-blur', function (event, args) { });

        $scope.$on('online', function (event, args) {
            $rootScope.$broadcast('download-whats-new', args);
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

        $scope.$on('push-service-initialized', function(event, args) {
            console.log("Push service initialized: " + args.token);
            tokenService.saveToDb("pushToken", args.token);
            tokenService.registerPushToken(args.token);
        });

        $scope.$on('push-notification', function (event, args) {
            var title = args.notification.title;
            var userData = args.notification.userdata;
            alert(title + " > " + userData);
            console.log(args);
            communicationService.on(event, args);
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
        $scope.$on('load', function (event, args) { });


        // ------------------------------------
        // Application events 
        // ------------------------------------

        $scope.$on('logged-in', function(event, args) {
            console.log("Logged in, time to bind push token to app token");
        });

        $scope.$on('app-token-available', function (event, args) {
            $rootScope.$broadcast('download-whats-new', args);
        });


        // ------------------------------------
        // Factory-forwarded events 
        // ------------------------------------

        $scope.$on('new-messages', function (event, args) {
            messageRepository.on(event, args);
        });

        $scope.$on('updated-message', function (event, args) {
            messageRepository.on(event, args);
        });

        $scope.$on('download-whats-new', function (event, args) {
            communicationService.on(event, args);
        });


    }]);