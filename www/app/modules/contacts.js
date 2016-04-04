/**
 * Created by Kristofer on 2016-03-17.
 */
angular.module('contact', [])
    .controller('contactsCtrl', ['$scope', '$http', 'tokenService', 'contactsService', 'communicationService', '$cordovaSQLite', function($scope, $http, tokenService, contactsService, communicationService) {

        $scope.contacts = [];
        $scope.appUsers = [];
        $scope.foundAppUsers = [];
        $scope.appUserTest = { Test: "Hello"};

        $scope.GetAppUsersFromPhoneContacts = function(){
            contactsService.findAppUsersFromAllContacts();
        };

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

        $scope.AddUser = function(user){
          contactsService.insertAppUser(user);
        };

        $scope.RemoveUser = function(user){
            contactsService.removeUser(user);
        };

        function init(){
            var promise =  contactsService.getAppUsers();

            promise.then(
                function(success){
                    for (var i = 0; i < success.length; i++){
                        $scope.appUsers.push(success[i]);
                    }

                },
                function(error){
                    console.log('Could not get appUsers!')
                }
            );

            $scope.contacts = contactsService.getPhoneContacts();
        };

        init();

    }])