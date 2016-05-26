/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('debug', [])
    .controller('debugCtrl', [
        '$scope', 'logService', 'dataService', function ($scope, logService, dataService) {

            $scope.capturedLogs = logService.capturedLogs;

            $scope.targets = logService.options.targets;

            $scope.logSorting = function (log) {
                var date = new Date(log.createdOn);
                return date;
            };

            $scope.clearDebugView = function () {
                $scope.capturedLogs.length = 0;
            }

            $scope.getLogsFromDb = function () {
                logService.getLogsFromDb().then(function (success) {
                    success.some(function (log) {
                        $scope.capturedLogs.unshift(log);
                    });
                });
            }

            $scope.clearDatabase = function () {
                logService.clearLogTable();
            }

            $scope.printConversationsInMemory = function() {
                console.table(dataService.conversations);
                dataService.conversations.some(function(conversation) {
                    logService.log(new LogObject('Conversation', conversation));
                });
            }

            $scope.$watch("targets.console", function (state) {
                logService.updateTargetState('console', state);
            }, true);

            $scope.$watch("targets.database", function (state) {
                logService.updateTargetState('database', state);
            }, true);

            $scope.$watch("targets.eventView", function (state) {
                logService.updateTargetState('eventView', state);
            }, true);
        }
    ]);
