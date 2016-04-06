/**
 * Created by Robin Jobb on 2016-04-06.
 */
angular.module('profile',[])
    .controller('editProfileCtrl', function ($scope, tokenService) {
        $scope.displayName = tokenService.getUsername();
        $scope.firstName = tokenService.getFirstName();
        $scope.lastName = tokenService.getLastName();

        $scope.save = function (firstName, lastName) {
            alert(firstName+" "+lastName);
        }
    });