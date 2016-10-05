/**
 * Created by Robin Jobb on 2016-04-06.
 */
angular.module('settings',[])
    .controller('settingsCtrl', function ($scope, communicationService) {

        $scope.advancedSettings = false;
        $scope.newMessageEvents = [];
        $scope.conversations = [];

        $scope.syncMessages = function() {
            communicationService.syncPeriodMessages($scope.sync.From, $scope.sync.To, 0, 50);
        }

        $scope.$on('new-messages', function (event, args) {
            pushToEvents('Messages recevied from backend.');
        });

        $scope.$on('messages-added', function (event, args) {
            pushToEvents('Messages added to repository.');
        });

        function pushToEvents(event) {
            if ($scope.newMessageEvents.length > 50) {
                $scope.newMessageEvents.pop();
            }
            $scope.newMessageEvents.unshift(event);
        }
    });