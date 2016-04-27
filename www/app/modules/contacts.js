/**
 * Created by Kristofer on 2016-03-17.
 */
angular.module('contact', [])
    .controller('contactsCtrl', ['$scope', '$http', 'tokenService', 'contactsService', 'communicationService', '$cordovaSQLite', function ($scope, $http, tokenService, contactsService, communicationService) {

        $scope.contacts = [];
        $scope.appUsers = [];
        $scope.foundAppUsers = [];
        $scope.isLoading = false;
        $scope.query = {};

        $scope.getAppUsersFromPhoneContacts = function () {
            contactsService.findAppUsersFromAllContacts();
        };

        $scope.valueNullOrUndefined = function (val) {
            if (val === null || val === undefined || val === "") {
                return true;
            } else {
                return false;
            }
        }

        $scope.clearSearch = function () {
            $scope.isLoading = true;
            $scope.query.text = null;
            $scope.foundAppUsers = [];
            $scope.isLoading = false;
        }

        $scope.search = function () {
            $scope.isLoading = true;
            $scope.foundAppUsers = [];
            var promise = contactsService.searchAppUser($scope.query.text);

            promise.then(function (success) {
                for (var i = 0; i < success.data.items.length; i++) {
                    $scope.foundAppUsers.push(success.data.items[i]);
                }
                $scope.isLoading = false;
            }, function (error) {
                $scope.isLoading = false;
            });
        }

        $scope.addUser = function (user) {
            var addUserPromise = contactsService.insertAppUser(user);

            addUserPromise.then(
                function (success) {

                    var index = -1;

                    for (var i = 0; i < $scope.foundAppUsers.length; i++) {
                        var appUser = $scope.foundAppUsers[i];
                        if (appUser.id === user.id) {
                            index = i;
                        }
                    }

                    if (index > -1) {
                        $scope.foundAppUsers.splice(index, 1);
                    }

                    $scope.appUsers.push(user);

                }, function (error) {

                });
        };

        $scope.removeUser = function (user) {
            var deletePromise = contactsService.removeUser(user.id);

            deletePromise.then(
                function (success) {

                    var index = -1;

                    for (var i = 0; i < $scope.appUsers.length; i++) {
                        var appUser = $scope.appUsers[i];
                        if (appUser.id === user.id) {
                            index = i;
                        }
                    }

                    if (index > -1) {
                        $scope.appUsers.slice(index, 1);
                    }
                },
                function (error) {

                });
        };

        function init() {
            var promise = contactsService.getAppUsers();

            promise.then(
                function (success) {
                    for (var i = 0; i < success.length; i++) {
                        $scope.appUsers.push(success[i]);
                    }

                },
                function (error) {
                    console.log('Could not get appUsers!');
                }
            );
        };

        init();

    }])