/**
 * Created by Kristofer on 2016-03-17.
 */
angular.module('contact', [])
    .controller('contactsCtrl', ['$scope', '$http', 'tokenService', 'contactsService', function($scope, $http, tokenService, contactsService) {

        $scope.contacts = [];
        $scope.appUsers = [];

        $scope.Sync = function(){
            contactsService.findAppUsersFromAllContacts();
        };

        $scope.GetToView = function() {
            $scope.appUsers = contactsService.getAppUsers();
            $scope.contacts = contactsService.getPhoneContacts();
        };

    }])