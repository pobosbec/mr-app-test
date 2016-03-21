/**
 * Created by Kristofer on 2016-03-17.
 */
angular.module('contact', [])
    .controller('contactsCtrl', ['$scope', '$http', 'tokenService', 'contactsService', function($scope, $http, tokenService, contactsService) {

        $scope.contacts = [];
        $scope.appUsers = [];

        function init(){
            contactsService.init();
            $scope.appUsers = contactsService.getAppUsers();
            $scope.contacts = contactsService.getPhoneContacts();
        };

        $scope.Sync = function(){
            contactsService.findAppUsersFromAllContacts();
        };

        $scope.ListPhoneContacts = function (){
            contactsService.retriveAllPhoneContacts();
        }

        init();

    }])