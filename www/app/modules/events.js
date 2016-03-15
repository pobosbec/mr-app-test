/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('event', [])
    .controller('eventCtrl', ['$scope', '$rootScope', '$http', 'tokenService', 'communicationService', 'messageRepository', function ($scope, $rootScope, $http, tokenService, communicationService, messageRepository) {

        document.addEventListener('deviceready', function (event, args) {
            $rootScope.$broadcast('device-ready', args);
        }, false);

        if (window.addEventListener) {
            window.addEventListener('load', function (event, args) {
                $rootScope.$broadcast('load', args);
            }, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", function (event, args) {
                $rootScope.$broadcast('load', args);
            });
        }

        $scope.$on('app-token-available', function (event, args) {
            //console.log("app-token-available");
            $rootScope.$broadcast('download-whats-new', args);
        });

        $scope.$on('load', function (event, args) {});
        $scope.$on('device-ready', function (event, args) {
            messageRepository.on(event, args);
        });

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