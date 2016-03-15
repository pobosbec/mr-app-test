/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('event', [])
    .controller('eventCtrl', ['$scope', '$rootScope', '$http', 'tokenService', 'communicationService', 'messageRepository', function ($scope, $rootScope, $http, tokenService, communicationService, messageRepository) {

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


        // Wrapped
        $scope.$on('device-ready', function (event, args) {
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
            console.log($.mobile.activePage);
            if ($.mobile.activePage.is('#/login') || $.mobile.activePage.is('#/home')) {
                e.preventDefault();
                navigator.app.exitApp();
            }
            else {
                navigator.app.backHistory();
            }
        });

        $scope.$on('menu-button', function (event, args) { });


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

        $scope.$on('logged-in', function (event, args) { });

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