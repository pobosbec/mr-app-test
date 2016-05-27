// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.
angular.module('modalcontroll', [])
    .controller('createMessageCtrl', function ($scope, $uibModalInstance, contactsService, communicationService, tokenService, logService) {

        $scope.users = [];
        $scope.selectedUsers = [];
        $scope.selected = '';
        $scope.errors = [];
        $scope.messageSentConfirmed = false;

        $scope.getUsers = function () {
            var promise = contactsService.getAppUsers();

            promise.then(
                function (success) {
                    $scope.users = success;
                },
                function (error) {
                    logService.log('Could not get appUsers.');
                });
        };

        $scope.messageSent = false;
        $scope.messageFailed = false;

        $scope.sendMessage = function (message) {
            $scope.errors.length = 0;
            if ($scope.selectedUsers.length === 0) {
                $scope.errors.push('You must add at least one recipient.');
            }

            if (message === null || message === undefined) {
                $scope.errors.push('You must type a message to send.');
            }

            if (message != null) {
                if (message.length === 0) {
                    $scope.errors.push('You must type a message to send.');
                }
            }

            if ($scope.errors.length > 0) {
                return;
            }

            var userIds = [tokenService.getAppUserId()];
            for (var i = 0; i < $scope.selectedUsers.length; i++) {
                userIds.push($scope.selectedUsers[i].id);
            }
            communicationService.sendMessage(message, userIds).then(function successCallback(response) {
                $scope.messageSentConfirmed = true;
                communicationService.downloadMessagesForConversation(response.data.data.conversationId, false, 0, 10, true);
                setTimeout(function () {
                    $uibModalInstance.close();
                }, 1000);
            }, function errorCallback(response) {
                $scope.messageSentConfirmed = true;
            });
        };

        $scope.find = function (data) {
            alert(data);
            logService.log(contactsService.getAppUsers());
        };

        $scope.onSelect = function ($item, $model, $label) {
            $scope.selectedUsers.push($item);
        }

        $scope.removeSelectedAppUser = function (appUser) {
            var index = -1;

            for (var i = 0; i < $scope.selectedUsers.length; i++) {
                if ($scope.selectedUsers[i].userId === appUser.userId) {
                    index = i;
                }
            }

            if (index > -1) {
                $scope.selectedUsers.splice(index, 1);
            }
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.getUsers();
    });/**
 * Created by Robin Jobb on 2016-03-30.
 */
