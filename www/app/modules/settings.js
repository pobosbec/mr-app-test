/**
 * Created by Robin Jobb on 2016-04-06.
 */
angular.module('settings',[])
    .controller('settingsCtrl', function ($scope, communicationService) {
        $scope.sync = function () {
            alert("Syncing from contacts not implemented");
        };

        /* Makes a request to the api to get messages between two dateTimes. Could be used in a syncing service
         * if the user has dropped the local database.
         */
        $scope.syncMessages = function(from, to){
            communicationService.syncPeriodMessages(from.toJSON(), to.toJSON(), 0, 50);
        };
    });