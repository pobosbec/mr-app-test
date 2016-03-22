/**
 * Created by Kristofer on 2016-03-17.
 */
angular.module('contact', [])
    .controller('contactsCtrl', ['$scope', '$http', 'tokenService', 'contactsService', 'communicationService', function($scope, $http, tokenService, contactsService, communicationService) {

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
                    $scope.foundAppUsers = success.data;
                }, function(error){
                });

            $scope.$apply();
        }

        $scope.SendMessage = function(message, users){
            var usersToSendTo = [];
            usersToSendTo.push(users);
            usersToSendTo.push(tokenService.getAppUserId());
            communicationService.sendMessage('hello from app!', usersToSendTo);
        }

        init();

    }])