// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.
angular.module('modalcontroll',[])
    .controller('createMessageCtrl', function ($scope, $uibModalInstance, contactsService, communicationService, tokenService) {

        $scope.users = [];
        $scope.selectedUsers = [];
        $scope.selected = '';

        $scope.getUsers = function(){
            var promise = contactsService.getAppUsers();

            promise.then(
                function(success){
                   $scope.users = success;
                },
                function(error){
                    console.log('Could not get appUsers.')
                });
        };

        $scope.sendMessage = function(message) {
            var userIds = [tokenService.getAppUserId()];
            for(var i = 0; i < $scope.selectedUsers.length; i++){
                userIds.push($scope.selectedUsers[i].userId);
            }
            communicationService.sendMessage(message, userIds);
            $uibModalInstance.close();
        };

        $scope.find = function (data) {
            alert(data);
            console.log(contactsService.getAppUsers());
        };

        $scope.onSelect = function($item, $model, $label){
            $scope.selected = '';
            $scope.selectedUsers.push($item);
        }

        $scope.removeSelectedAppUser = function(appUser){
            var index = -1;

            for(var i = 0; i < $scope.selectedUsers.length; i++){
                if($scope.selectedUsers[i].userId === appUser.userId){
                    index = i;
                }
            }

            if(index > -1){
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
