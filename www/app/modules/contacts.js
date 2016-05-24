/**
 * Created by Kristofer on 2016-03-17.
 */
angular.module('contact', [])
    .controller('contactsCtrl', ['$scope', '$http', 'tokenService', 'contactsService', '$q', 'logService', function ($scope, $http, tokenService, contactsService, $q, logService) {

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
            $scope.foundAppUsers.length = 0;
            $scope.isLoading = false;
        }

        $scope.search = function () {
            $scope.isLoading = true;
            $scope.foundAppUsers.length = 0;

            if ($scope.query.text === "" || $scope.query.text === null || $scope.query.text === undefined) {
                $scope.isLoading = false;
                return;
            }

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
                    var findUserPromise = contactsService.getAppUser(user.id);
                    return findUserPromise;
                }, function (error) {
                    logService.error('Could not fetch user.');
                }).then(function (findUserPromise) {
                    if (findUserPromise.length === 0) {
                        logService.error('Could not fetch user.');
                    }
                    var index = -1;

                    for (var i = 0; i < $scope.foundAppUsers.length; i++) {
                        var appUser = $scope.foundAppUsers[i];
                        if (appUser.id === findUserPromise[0].id) {
                            index = i;
                        }
                    }

                    if (index > -1) {
                        $scope.foundAppUsers.splice(index, 1);
                    }

                    var found = findUserPromise[0];
                    logService.log(found);

                    $scope.appUsers.push(findUserPromise[0]);
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
                        $scope.appUsers.splice(index, 1);
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
                    logService.log('Could not get appUsers!');
                }
            );
        };

        init();

    }])