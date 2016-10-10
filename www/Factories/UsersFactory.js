angular.module('UsersFactory', [])
    .factory('UsersFactory',['$rootScope', '$http', '$timeout', 'ApiFactory',function($rootScope, $http, $timeout, apiFactory) {

            var users = [];

            function myUser() {
                return $rootScope.myAppUser;
            }

            function getInboxUserDetails(token, inboxId, userIds, callback) {
                var inboxUserDetailsRequest = {
                    authenticationToken: apiFactory.getToken(),
                    data: {
                        'inboxId': inboxId,
                        'userIds': userIds
                    }
                };
                apiFactory.functions.call('inboxes/get-users',
                    inboxUserDetailsRequest,
                    function(response) {
                        if (response.data != null) {
                            callback(response.data);
                        }
                    });
            }

            function addUser(user) {
                users.push(user);
            }

            function addUsersById(userIds, inboxId, callback, error) {

                // get user details
                getInboxUserDetails(
                    apiFactory.getToken(),
                    inboxId,
                    userIds,
                    function(usersWithDetails) {
                        for (var j = 0; j < usersWithDetails.length; j++) {
                            users.push({
                                'userId': usersWithDetails[j].userId,
                                'displayName': usersWithDetails[j].userDisplayName,
                                'avatar': usersWithDetails[j].avatar
                            });
                        }

                        callback(users);

                    },
                    function(error) {

                    });

            }

            function getUser(appUserId, callback, error) {
                var appUserDetailsRequest = {
                    authenticationToken: apiFactory.getToken(),
                    data: {
                        'instanceName': apiFactory.apiSettings.instanceName,
                        'userId': appUserId
                    }
                };

                apiFactory.functions.call('users/details-for-user',
                    appUserDetailsRequest,
                    function(response) {
                        //console.log(response.data);
                        callback(response.data);
                    },
                    function(e) {
                        error(e);
                    });
            }

            function getUsers() {
                return users;
            }

            function registerUser(instanceName, userName, password, callback, error) {
                var registerUserRequest = {
                    'data': {
                        'instanceName': apiFactory.apiSettings.instanceName,
                        'userName': userName,
                        'password': password
                    }
                };
                apiFactory.functions.call('users/register',
                    registerUserRequest,
                    function(response) {
                        if (response.errors.length > 0) {
                            error(response.errors);
                        }

                        if (response.data != null) {
                            if (response.data.errors != null && response.data.errors.length > 0) {
                                error(response.data.errors[0]);
                            } else {
                                callback(response);
                            }
                        }

                    },
                    function(e) {
                        if (e.data != null && e.data.errors != null) {
                            error(e.data.errors);
                        } else {
                            error([
                                {
                                    'errorMessage': 'Could not register user, username already exists'
                                }
                            ]);
                        }
                    });
            }

            function updateProfile(firstName, lastName, email, phone, avatar, callback, error) {

                var updateProfileRequest = {
                    "AuthenticationToken": apiFactory.getToken(),
                    "Data": {
                        "Firstname": firstName,
                        "Lastname": lastName,
                        "EmailAddress": email,
                        "PhoneNumber": phone,
                        "Avatar": avatar
                    }
                };
                console.log(updateProfileRequest);
                apiFactory.functions.call('users/change-information',
                    updateProfileRequest,
                    function(response) {
                        callback(response);
                    },
                    function(e) {
                        error(e);
                    });
            }

            function findUser(searchText, inboxId, callback, error) {
                var findUserRequest = {
                    authenticationToken: apiFactory.getToken(),
                    data: {
                        'inboxId': inboxId,
                        'query': searchText
                    }
                };
                //console.log(findUserRequest);
                apiFactory.functions.call('inboxes/search',
                    findUserRequest,
                    function(response) {
                        //console.log(response);
                        callback(response.data);
                    },
                    function(e) {
                        error(e);
                    });
            }

            return {
                myUser: myUser,
                addUser: addUser,
                addUsersById: addUsersById,
                getUser: getUser,
                getUsers: getUsers,
                getInboxUserDetails: getInboxUserDetails,
                registerUser: registerUser,
                updateProfile: updateProfile,
                findUser: findUser
            };
        }
    ]);

