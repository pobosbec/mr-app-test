// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.
angular.module('modalcontroll',[])
    .controller('createMessageCtrl', function ($scope, $uibModalInstance, contactsService) {

            $scope.users = [];

            $scope.getUsers = function(){
              $scope.users = contactsService.getAppUsers();
            };

            $scope.getUsers();

            console.log($scope.users);
            $scope.createMsg = function () {
                    alert('noothing');
                    $uibModalInstance.close();
            };

            $scope.find = function (data) {
                    alert(data);
                    console.log(contactsService.getAppUsers());
            };

            $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');

            };
    });/**
 * Created by Robin Jobb on 2016-03-30.
 */
