/**
 * Created by Kristofer on 2016-03-17.
 */
angular.module('contact', [])
    .controller('contactsCtrl', ['$scope', '$http', 'tokenService', 'contactsService', function($scope, $http, tokenService, contactsService) {

        $scope.contacts = [];
        $scope.appUsers = [];
        $scope.foundAppUsers = [];

        function init(){
            contactsService.init();
            $scope.appUsers = contactsService.getAppUsers();
            $scope.contacts = contactsService.getPhoneContacts();
        };

        $scope.Sync = function(){
            contactsService.findAppUsersFromAllContacts();
        };

        $scope.CheckForAppUsersAmongContacts = function (){
            contactsService.retriveAllPhoneContacts();
        }

        $scope.Search = function(query){
                var queryArr = [];
                queryArr.push(query);
                var promise = contactsService.searchAppUser(queryArr);

                promise.then(function(success){
                    $scope.appUsers = success.data;
                }, function(error){
                });

            $scope.$apply();
        }

        init();

    }])