/**
 * Created by robinpipirs on 11/12/15.
 */

angular.module('token', [])
    .factory('tokenService', ['$http', '$window', '$rootScope', '$location', '$q', '$state', function ($http, win, $rootScope, $location, $q, $state) {
        $rootScope.token = null;
        var username = null;
        var token = null;
        var appToken = null;
        var pushToken = null;
        var appUserId = null;
        var appUsername = null;
        var adminId = null;
        var accountId = null;
        var wfId = null;
        var factory = {};
        var aquiredUserName = false;

        //the instance of the Timeout event that run keepTokenAlive
        var tokenTimer;
        //The interval which keepTokenAlive should be runned
        var interval = 1000000;


        /**
         * Checks if theres an token in the sessionStorage if so authenticate it
         */
        $rootScope.$watch('$viewContentLoaded', function () {

            if (win.sessionStorage.accessToken != null) {
                factory.isAuthenticated(win.sessionStorage.accessToken);
            }
            else {
                $state.go('login');
            }
        });

        /**
         * checks if the user opens the page with a passed token. if so try to authenticate with it.
         */
        var location = $location;
        $rootScope.$watch('location.search()', function () {
            var token = ($location.search()).token;
            if (token != null) {
                factory.isAuthenticated(token);
            }
        }, true);

        /**
         * Logout function
         */
        $rootScope.logout = function () {
            //TODO abandon function
            factory.abandonToken($rootScope.token);
            win.sessionStorage.accessToken = null;
            $rootScope.token = null;
            token = null;
            factory.unRegisterPushToken();
            factory.saveToDb("klik", false);
            factory.saveToDb("kliu", null);
            factory.saveToDb("klip", null);
            $state.go('login');
            clearTimeout(tokenTimer);
            $('#template-2').hide();
            aquiredUserName = false;
        };

        /**
         * function that increments our tokens expire time
         * @var interval here you can set the interval time for refresh 1000 = 1s, 60000 = 1min
         */
        factory.keepTokenAlive = function () {
            factory.isAuthenticated(token);
        };

        /**
         * Calls api /is-authenticated with data as token this call also refreshes the lifetime of the token
         * @param data token
         */
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

            $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.

                win.alert("error abandoning token");
            });
        };

        factory.refreshIds = function () {
            var response = factory.isAuthenticated(win.sessionStorage.accessToken).then(function(response) {
                token = response.data.data.id;
                $rootScope.token = token;
                adminId = response.data.data.administratorId;
                accountId = response.data.data.accountId;
            });
            return response;
        };

        factory.isAppAuthenticated = function (authenticationToken) {
            var req = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: factory.currentAppApiUrl + 'app/is-token-valid',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: { AuthenticationToken: authenticationToken },
                    AuthenticationToken: authenticationToken
                }
            };

            return $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                appUserId = response.data.data.appUserId;
                appToken = response.data.data.id;
                factory.saveToDb("appUserId", appUserId);
                factory.saveToDb("appAuthToken", appToken);
                $rootScope.$broadcast("app-token-available");
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        };

        /**
         * Calls api /is-authenticated with data as token this call also refreshes the lifetime of the token
         * @param data token
         */
        factory.isAuthenticated = function (data) {
            token = data;
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

            return $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                //things to fetch
                token = response.data.data.id;
                $rootScope.token = token;
                adminId = response.data.data.administratorId;
                accountId = response.data.data.accountId;
                // this callback will be called asynchronously
                // when the response is available

                //things to fetch
                token = response.data.data.id;
                $rootScope.token = token;
                adminId = response.data.data.administratorId;
                accountId = response.data.data.accountId;


                if (!aquiredUserName) {
                    aquiredUserName = !aquiredUserName;
                    factory.getDetails();
                }
                //start keepTokenAlive timer
                tokenTimer = setTimeout(function () { factory.keepTokenAlive }, interval);
                //store token in session
                win.sessionStorage.accessToken = token;
                //redirect to dashboard
                if ($state.includes('login')) {
                    $state.go('home');
                }

                factory.isAppAuthenticated(token);

                return response;

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //store token in session
                win.sessionStorage.accessToken = null;
                factory.saveToDb("authToken", null);
                factory.saveToDb("appAuthToken", null);
                factory.saveToDb("appUserId", null);
                factory.saveToDb("userName", null);
                //redirect to login
                //change to dashboard
                $state.go('login');
                //we are logged in show navbar and redirect
                $('#template-2').hide();
            });
            return $q.reject(response);
        };


        factory.registerPushToken = function () {
            if (factory.getAppUserId() == null || factory.getAuthToken() == null) {
                factory.refreshIds();
            }

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
                return response;
            }, function errorCallback(response) {

                console.error("registerPushToken update error");
                console.error(response);

                return $q.reject(response);
            });

            return $q.reject(response);
        }

        factory.unRegisterPushToken = function () {
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

        /**
         * getDetails http posts to api to fetch accounts details
         * @data adminId
         */
        factory.getDetails = function () {

            var req = {
                method: 'POST',
                url: factory.currentApiUrl + 'accounts/details',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {},
                    "AuthenticationToken": factory.getAuthToken(),
                    "Tags": null
                }
            };

            $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                var data = response.data;
                if (response.data.data.name != null) {
                    username = response.data.data.name;
                }

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        };

        factory.getUsername = function () {
            if (username == null) {
                username = JSON.parse(localStorage.getItem("userName"));
            }
            return username;
        };

        factory.getAdminId = function () {
            if (adminId === null) {
                var refreshIds = factory.refreshIds();
                refreshIds.then(function (response) {
                    return adminId; //response.data.administratorId();
                });
            } else {
                return adminId;
            }
        };

        factory.getAccountId = function () {
            if (accountId === null) {
                var refreshIds = factory.refreshIds();
                refreshIds.then(function (response) {
                    return accountId; //factory.getAccountId();
                });
            } else {
                return accountId;
            }
        };

        factory.getAuthToken = function () {
            if (token == null) {
                if (win.sessionStorage.accessToken != null) {
                    token = win.sessionStorage.accessToken;
                } else {
                    token = JSON.parse(localStorage.getItem("authToken"));
                }
            }
            return token;
        };

        factory.getAppAuthToken = function () {
            if (appToken == null) {
                appToken = JSON.parse(localStorage.getItem("appAuthToken"));
            }
            return appToken;
        };

        factory.getAppUserId = function () {

            if (appUserId === null) {
                var refreshIds = factory.refreshIds();
                refreshIds.then(function (response) {
                    return appUserId;
                });
            } else {
                return appUserId;
            }
            return appUserId;
        };

        factory.getPushToken = function () {
            if (pushToken == null) {
                pushToken = JSON.parse(localStorage.getItem("pushToken"));
            }
            return pushToken;
        }

        factory.saveToDb = function (key, value) {
            var valueAsJson = JSON.stringify(value);
            localStorage.setItem(key, valueAsJson);
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
            return "https://api2.mobileresponse.se/";
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
