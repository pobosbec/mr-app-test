/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('debug', [])
    .controller('debugCtrl', [
        '$scope', 'logService', function ($scope, logService) {

            $scope.capturedLogs = logService.capturedLogs;

            $scope.targets = logService.options.targets;

            $scope.logSorting = function (log) {
                var date = new Date(log.createdOn);
                return date;
            };
        }
    ]);
