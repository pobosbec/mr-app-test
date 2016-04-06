/**
 * Created by Robin Jobb on 2016-04-06.
 */
angular.module('settings',[])
    .controller('settingsCtrl', function ($scope) {
        $scope.sync = function () {
            alert("Syncing from contacts not implemented");
        };
    });