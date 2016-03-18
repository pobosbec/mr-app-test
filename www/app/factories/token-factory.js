
/**
 * Created by robinpipirs on 11/12/15.
 */

angular.module('token', [])
    .factory('tokenService', ['$http', '$window', '$rootScope', '$location', '$q', '$state', function ($http, win, $rootScope, $location, $q, $state) {
        $rootScope.token = null;
        var token = null;
        var pushToken = null;
        var refreshTokenIntervall = null;
        var factory = {};
        var userDetails = {};

        factory.keepTokenAlive = function () {
            var req = {
                method: 'POST',
                url: factory.currentAppApiUrl + 'app/is-token-valid',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {},
                    "AuthenticationToken": userDetails.token,
                    "Tags": null
                }
            };
            refreshTokenIntervall = setInterval(
                function () {
                    var promise = factory.httpPost(req);
                    promise.then(function (greeting) {
                        //Success
                        console.log('Sucess refreshed token');
                        console.log(greeting);
                    }, function (reason) {
                        //failed try
                        console.log('Failed refreshing token');
                        console.log(reason);
                        $rootScope.logout();
                    });
                }, (15 * 60 * 1000));
        };

        $rootScope.logout = function () {
            //TODO abandon function
            win.sessionStorage.accessToken = null;
            $rootScope.token = null;
            token = null;
            clearInterval(refreshTokenIntervall);
            factory.unRegisterPushToken();
            factory.clearLoginCredentials();

            $state.go('login');

            $('#template-2').hide();
            factory.abandonToken($rootScope.token);
        };

        factory.abandonToken = function (data) {
            var req = {
                method: 'POST',
                url: factory.currentApiUrl + 'is-authenticated',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {},
                    "AuthenticationToken": data,
                    "Tags": null
                }
            };
            var promise = factory.httpPost(req);
            promise.then(function (greeting) {
                //Success
                console.log('Success abandoned usertoken');
                console.log(greeting);
            }, function (reason) {
                //failed try
                console.log('Failed abandoning token');
                console.log(reason);

            });
        };

        //set user credentials
        function setCredentialsAndLogin(greeting) {
            console.log("setting credentials for following user:");
            console.log(greeting);
            //fetch user details
            userDetails = {
                token: greeting.data.id,
                accountId: greeting.data.accountId,
                administratorId: greeting.data.administratorId,
                appUserId: greeting.data.appUserId,
                displayName: ""
            };

            var userDetailRequest = {
                method: 'POST',
                url: factory.currentAppApiUrl + 'app/users/details',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {
                        "InstanceName": "mobileresponse"
                    },
                    "AuthenticationToken": greeting.data.id,
                    "Tags": null
                }
            };
            var promise = factory.httpPost(userDetailRequest);
            promise.then(function (greeting) {
                //Success
                console.log('Success fetched userdetails');
                console.log(greeting);
                if (userDetails.displayName != null) {
                    userDetails.displayName = greeting.data.displayName;
                }
                else if (userDetails.firstName != null) {
                    userDetails.displayName = greeting.data.firstName;
                }
                else if (userDetails.phoneNumber != null) {
                    userDetails.displayName = greeting.data.phoneNumber;
                }
                console.log(userDetails.displayName);
                //TODO: logged in now transfer home
                $rootScope.$broadcast("app-token-available");
                $rootScope.$broadcast("logged-in");
                factory.keepTokenAlive();
                if ($state.includes('login')) {
                    $state.go('home');
                }

            }, function (reason) {
                //failed try authenticate against admin->app
                console.log('Failed getting userdetails');
                console.log(reason);
                //TODO: set username to something different
                $state.go('login');
                //we are logged in show navbar and redirect
                $('#template-2').hide();
            });
        }

        factory.authenticate = function (username, password, keepLoggedIn) {
            var appAuthenticate = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: factory.currentAppApiUrl + 'app/authenticate',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {
                        "InstanceName": "mobileresponse",
                        "Username": username,
                        "Password": password
                    },
                    "Tags": null
                }
            };

            var adminAuthenticate = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: factory.currentApiUrl + 'authenticate',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {
                        "InstanceName": "mobileresponse",
                        "Username": username,
                        "Password": password
                    },
                    "Tags": null
                }
            };

            var promise = factory.httpPost(appAuthenticate);
            promise.then(function (greeting) {
                //Success
                console.log('Success appuser authentication');
                console.log(greeting);
                //TODO: logged in now
                factory.saveLoginCredentials(username, password, keepLoggedIn);
                setCredentialsAndLogin(greeting);
            }, function (reason) {
                //failed try authenticate against admin
                console.log('Failed App authentication, trying with admin');
                console.log(reason);
                promise = factory.httpPost(adminAuthenticate);
                promise.then(function (greeting) {
                    //Admin authenticate success
                    console.log('Success admin authenticate now authenticating towards app');
                    console.log(greeting);
                    var authenticationTokenAdmin = greeting.data.id;
                    appTokenAuthentication = {
                        method: 'POST',
                        ignoreLoadingBar: true,
                        url: factory.currentAppApiUrl + 'app/is-token-valid',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: {
                            Data: { AuthenticationToken: authenticationTokenAdmin },
                            AuthenticationToken: authenticationTokenAdmin
                        }
                    };
                    promise = factory.httpPost(appTokenAuthentication);
                    promise.then(function (greeting) {
                        //Success
                        console.log('Success admin-> app');
                        console.log(greeting);
                        //TODO: logged in now
                        factory.saveLoginCredentials(username, password, keepLoggedIn);
                        setCredentialsAndLogin(greeting);

                    }, function (reason) {
                        //failed try authenticate against admin->app
                        console.log('Failed login admin->app');
                        console.log(reason);
                        //TODO:go back to login
                        $state.go('login');
                        //we are logged in show navbar and redirect
                        $('#template-2').hide();
                    });

                }, function (reason) {
                    //failed try authenticate against admin
                    console.log('Failed login admin');
                    console.log(reason);
                    //go back to login
                    //TODO:go back to login
                    $state.go('login');
                    //we are logged in show navbar and redirect
                    $('#template-2').hide();
                });
            });
        };

        factory.httpPost = function (req) {

            var deferred = $q.defer();

            $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                deferred.resolve(response.data);

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                console.log(response); // TODO: REMOVE! only for debugging.
                deferred.reject(response.data);
            });
            return deferred.promise;
        };

        factory.registerPushToken = function () {

            deivceId = typeof device != 'undefined' ? device.uuid : null;
            if (deivceId != null) {
                var req = {
                    method: 'POST',
                    url: factory.currentAppApiUrl + 'app/users/update-device',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        "Data": {
                            InstanceName: "mobileresponse",
                            UserId: factory.getAppUserId(),
                            HardwareId: device.uuid,
                            PushToken: factory.getPushToken(),
                            DeviceType: window.deviceType,
                            MacAddress: null
                        },
                        "AuthenticationToken": factory.getAuthToken(),
                        "Tags": null
                    }
                };

                return $http(req).then(function successCallback(response) {
                    console.log("registerPushToken update success");
                    $rootScope.$broadcast('push-token-registered', args);
                    return response;
                }, function errorCallback(response) {

                    console.error("registerPushToken update error");
                    console.error(response);

                    return $q.reject(response);
                });

                return $q.reject(response);
            }
        };

        factory.unRegisterPushToken = function () {
            deivceId = typeof device != 'undefined' ? device.uuid : null;
            if (deivceId != null) {
                var req = {
                    method: 'POST',
                    url: factory.currentAppApiUrl + 'app/users/unregister-device',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        "Data": {
                            HardwareId: device.uuid
                        },
                        "AuthenticationToken": factory.getAuthToken(),
                        "Tags": null
                    }
                };

                return $http(req).then(function successCallback(response) {
                    return response;
                }, function errorCallback(response) {

                    console.log("unRegisterPushToken error");
                    console.log(response);

                    return $q.reject(response);
                });

                return $q.reject(response);
            }
        };

        factory.getUsername = function () {
            return userDetails.displayName;
        };

        factory.getAdminId = function () {
            return userDetails.administratorId;
        };

        factory.getAccountId = function () {
            return userDetails.accountId;
        };

        factory.getAuthToken = function () {
            return userDetails.token;
        };

        factory.getAppAuthToken = function () {
            return userDetails.token;
        };

        factory.getAppUserId = function () {
            return userDetails.appUserId;
        };

        factory.getPushToken = function () {
            if (pushToken == null) {
                pushToken = JSON.parse(localStorage.getItem("pushToken"));
            }
            return pushToken;
        };

        factory.saveToDb = function (key, value) {
            var valueAsJson = JSON.stringify(value);
            localStorage.setItem(key, valueAsJson);
        };

        factory.saveLoginCredentials = function (username, password, keepLoggedIn) {
            if (keepLoggedIn) {
                factory.saveToDb("keepLoggedIn", true);
                factory.saveToDb("keepLoggedInUser", username);
                factory.saveToDb("keepLoggedInPassword", password);
            }
        }

        factory.clearLoginCredentials = function() {
            factory.saveToDb("keepLoggedIn", false);
            factory.saveToDb("keepLoggedInUser", null);
            factory.saveToDb("keepLoggedInPassword", null);
        }

        factory.clearLocalStorage()
        {
            localStorage.clear();
        }

        /**
         * When the service is runned, depending on what url mobile response uses we set the api address differently
         * @param host
         * @returns {*}
         */
        factory.getApiUrl = function (host) {
            // in test
            if (host.pathname.indexOf("/test") > -1)
                return "http://api2.test.mobileresponse.se";

            // in production
            if (host.pathname.indexOf("/production") > -1)
                return "https://api2.mobileresponse.se/";

            // in localhost
            if (host.host.indexOf("localhost") > -1)
                //return "http://10.100.126.80:8887/";
                //return "http://api2.test.mobileresponse.se/";
                return "https://api2.mobileresponse.se/";
            // in staging
            return "http://api.mobileresponse.se/";
        };

        /**
         * When the service is runned, depending on what url mobile response uses we set the api address differently
         * @param host
         * @returns {*}
         */
        factory.getAppApiUrl = function (host) {
            // in test
            if (host.pathname.indexOf("/test") > -1)
                return "http://api.test.mobileresponse.se";

            // in production
            if (host.pathname.indexOf("/production") > -1)
                return "https://api.mobileresponse.se/";

            // in localhost
            if (host.host.indexOf("localhost") > -1)
                return "https://api.mobileresponse.se/";
            // in staging
            return "https://api.mobileresponse.se/";
        };

        factory.getDeviceServiceUrl = function () {
            return "https://bngw1w5u7e.execute-api.eu-west-1.amazonaws.com/production/";
        };

        factory.getReservationServiceUrl = function () {
            //return "http://localhost:8885/";
            return "https://reservations.mobileresponse.se/";
        };

        /**
         * Instancing our apiurl to the browsers
         * @type {*}
         */
        factory.currentAppApiUrl = factory.getAppApiUrl(window.location);
        factory.currentApiUrl = factory.getApiUrl(window.location);
        factory.currentDeviceServiceUrl = factory.getDeviceServiceUrl(window.location);
        factory.currentReservationServiceUrl = factory.getReservationServiceUrl(window.location);
        return factory;

    }])











///**
// * getDetails http posts to api to fetch accounts details
// * @data adminId
// */
//factory.getDetails = function () {
//
//    var req = {
//        method: 'POST',
//        url: factory.currentApiUrl + 'accounts/details',
//        headers: {
//            'Content-Type': 'application/json'
//        },
//        data: {
//            "Data": {},
//            "AuthenticationToken": factory.getAuthToken(),
//            "Tags": null
//        }
//    };
//
//    $http(req
//    ).then(function successCallback(response) {
//        // this callback will be called asynchronously
//        // when the response is available
//        var data = response.data;
//        if (response.data.data.name != null) {
//            username = response.data.data.name;
//        }
//
//    }, function errorCallback(response) {
//        // called asynchronously if an error occurs
//        // or server returns response with an error status.
//    });
//};




//
//
//
//factory.refreshIds = function () {
//    var response = factory.isAuthenticated(win.sessionStorage.accessToken).then(function(response) {
//        token = response.data.data.id;
//        $rootScope.token = token;
//        adminId = response.data.data.administratorId;
//        accountId = response.data.data.accountId;
//    });
//    return response;
//};
//
//factory.isAppAuthenticated = function (authenticationToken) {
//    var req = {
//        method: 'POST',
//        ignoreLoadingBar: true,
//        url: factory.currentAppApiUrl + 'app/is-token-valid',
//        headers: {
//            'Content-Type': 'application/json'
//        },
//        data: {
//            Data: { AuthenticationToken: authenticationToken },
//            AuthenticationToken: authenticationToken
//        }
//    };
//
//    return $http(req
//    ).then(function successCallback(response) {
//        // this callback will be called asynchronously
//        // when the response is available
//        appUserId = response.data.data.appUserId;
//        appToken = response.data.data.id;
//        factory.saveToDb("appUserId", appUserId);
//        factory.saveToDb("appAuthToken", appToken);
//        $rootScope.$broadcast("app-token-available");
//    }, function errorCallback(response) {
//        // called asynchronously if an error occurs
//        // or server returns response with an error status.
//    });
//};
//

