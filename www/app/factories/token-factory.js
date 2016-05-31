
/**
 * Created by robinpipirs on 11/12/15.
 */

angular.module('token', [])
    .factory('tokenService', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'logService', function ($http, win, $rootScope, $location, $q, $state, logService) {
        $rootScope.token = null;
        var authenticationFailed = false;

        var token = null;
        var refreshTokenIntervall = null;
        var factory = {};
        var userDetails = {};

        //factory.keepTokenAlive = function () {
        //    var req = {
        //        method: 'POST',
        //        ignoreLoadingBar: true,
        //        url: factory.currentAppApiUrl + 'app/is-token-valid',
        //        headers: {
        //            'Content-Type': 'application/json'
        //        },
        //        data: {
        //            "Data": {},
        //            "AuthenticationToken": userDetails.token,
        //            "Tags": [$rootScope.version]
        //        }
        //    };
        //
        //    var refreshTokenSuccess = function (greeting) {
        //        //Success
        //        logService.log(new LogObject('Success refreshing token', greeting));
        //    };
        //
        //    var refreshTokenFailed = function (reason) {
        //        //failed attempt
        //        logService.log('Failed refreshing token');
        //        logService.log(reason);
        //
        //        var credentials = factory.keepLoggedInCredentialsFromDatabase();
        //        if (credentials.keepLoggedIn) {
        //            logService.log("Keep Logged in is active, attempting to re-authenticate");
        //            factory.authenticate(credentials.username, credentials.password, credentials.keepLoggedIn);
        //        } else {
        //            logService.log("Logging out");
        //            $rootScope.logout();
        //        }
        //    }
        //
        //    var refreshTokenFunction = function () {
        //        var promise = factory.httpPost(req);
        //        promise.then(function (greeting) {
        //            if (greeting.status && greeting.status.toLocaleLowerCase() !== "unauthorized") {
        //                refreshTokenSuccess(greeting);
        //            } else {
        //                refreshTokenFailed(greeting);
        //            }
        //        }, function (reason) {
        //            refreshTokenFailed(reason);
        //        });
        //    }
        //
        //    refreshTokenFunction();
        //    refreshTokenIntervall = setInterval(refreshTokenFunction, (15 * 60 * 1000));
        //};

        $rootScope.logout = function () {
            //TODO abandon function
            console.log("logged out from logout");
            $rootScope.$broadcast("logged-out");
            win.sessionStorage.accessToken = null;
            $rootScope.token = null;
            token = null;
            clearInterval(refreshTokenIntervall);
            factory.unRegisterPushToken();
            factory.clearLoginCredentials();
            factory.clearTokenData();
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
                    "Tags": ['version:' + $rootScope.version]
                }
            };
            var promise = factory.httpPost(req);
            promise.then(function (greeting) {
                //Success
                logService.log('Success abandoned usertoken');
                logService.log(greeting);
            }, function (reason) {
                //failed try
                logService.log('Failed abandoning token');
                logService.log(reason);

            });
        };

        function justSetCredentials(greeting) {
            logService.log("setting credentials for following user:");
            logService.log(greeting);
            //fetch user detail
                userDetails.token = greeting.data.id;
                userDetails.accountId = greeting.data.accountId;
                userDetails.administratorId = greeting.data.administratorId;
                userDetails.appUserId = greeting.data.appUserId;
        }

        //set user credentials
        function setCredentialsAndLogin(greeting) {
            logService.log("setting credentials for following user:");
            logService.log(greeting);
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
            var defered = $q.defer();
            var promise = factory.httpPost(userDetailRequest);
            promise.then(function (greeting) {
                //Success
                logService.log('Success fetched userdetails');
                logService.log(greeting);
                if (greeting.data.displayName != null) {
                    userDetails.displayName = greeting.data.displayName;
                }
                else {
                    if (greeting.data.firstName != null) {
                        userDetails.displayName = greeting.data.firstName;
                    }
                }
                if (greeting.data.firstName != null) {
                    userDetails.firstName = greeting.data.firstName;
                }
                if (greeting.data.lastName != null) {
                    userDetails.lastName = greeting.data.lastName;
                }
                if (greeting.data.phoneNumber != null) {
                    userDetails.phoneNumber = greeting.data.phoneNumber;
                }
                if (greeting.data.emailAddress != null) {
                    userDetails.emailAddress = greeting.data.emailAddress;
                }

                factory.saveToDb("userDetails", userDetails);

                //TODO: logged in now transfer home
                $rootScope.$broadcast("app-token-available");
                $rootScope.$broadcast("logged-in");
              //  factory.keepTokenAlive();
                if ($state.includes('login')) {
                    $state.go('home');
                }
                return defered.resolve("success set credentials");

            }, function (reason) {
                //failed try authenticate against admin->app
                logService.log('Failed getting userdetails');
                logService.log(reason);
                //TODO: set username to something different
                $state.go('login');
                //we are logged in show navbar and redirect
                $('#template-2').hide();

                return defered.reject("failed set credentials");
            });
        }

        //set user credentials
        factory.refreshUserDetails = function () {

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
                    "AuthenticationToken": factory.getAuthToken(),
                    "Tags": null
                }
            };
            var promise = factory.httpPost(userDetailRequest);
            promise.then(function (greeting) {
                //Success
                logService.log('Success fetched userdetails');
                logService.log(greeting);
                if (greeting.data.displayName != null) {
                    userDetails.displayName = greeting.data.displayName;
                }
                if (greeting.data.firstName != null) {
                    userDetails.firstName = greeting.data.firstName;
                }
                if (greeting.data.lastName != null) {
                    userDetails.lastName = greeting.data.lastName;
                }
                if (greeting.data.phoneNumber != null) {
                    userDetails.phoneNumber = greeting.data.phoneNumber;
                }
                logService.log(userDetails.displayName);
                factory.saveToDb("userDetails", userDetails);
            }, function (reason) {
                //failed try authenticate against admin->app
                logService.log('Failed getting userdetails');
                logService.log(reason);
            });
        };

        /**
         * This function is an version of authenticate but it wont log the user out if failed
         * @param username
         * @param password
         * @param keepLoggedIn
         */
        factory.justAuthenticate = function (username, password, keepLoggedIn) {
            // the API gives a 200 response-code with Error-text if we pass null, but 400 if we pass empty string.
            if (typeof username === "undefined" || username === null) { username = "" };
            if (typeof password === "undefined" || password === null) { password = "" };

            console.log("JustAuthenticate running");

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
                    "Tags": ['version:' + $rootScope.version]
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

            var promise = $q(function(resolve, reject) {

                var promise = factory.httpPost(appAuthenticate);

                promise.then(function(greeting) {
                    //Success
                    logService.log('Success appuser authentication');
                    logService.log(greeting);
                    justSetCredentials(greeting);
                    $rootScope.$broadcast("logged-in");
                    $rootScope.$broadcast('on-focus');
                    $rootScope.$broadcast("app-token-available");
                    authenticationFailed = false;
                    //return $q.defer().resolve(greeting);
                    resolve(greeting);

                }, function(reason) {
                    //failed try authenticate against admin
                    logService.log('Failed App authentication, trying with admin');
                    logService.log(reason);
                    promise = factory.httpPost(adminAuthenticate);

                    promise.then(function(greeting) {
                        //Admin authenticate success
                        logService.log('Success admin authenticate now authenticating towards app');
                        logService.log(greeting);
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
                            },
                            "Tags": ['version:' + $rootScope.version]
                        };

                        promise = factory.httpPost(appTokenAuthentication);
                        promise.then(function(greeting) {
                            //Success
                            justSetCredentials(greeting);
                            $rootScope.$broadcast("app-token-available");
                            $rootScope.$broadcast("logged-in");
                            $rootScope.$broadcast('on-focus');
                            logService.log('Success admin-> app');
                            logService.log(greeting);
                            //TODO: logged in now
                            authenticationFailed = false;
                            resolve(greeting);
                            //return $q.defer().resolve(greeting);

                        }, function(reason) {
                            authenticationFailed = true;
                            reject(reason);
                            //return $q.defer().reject(reason);
                        });

                    }, function(reason) {
                        //failed try authenticate against admin
                        logService.log('Failed login admin');
                        logService.log(reason);

                        authenticationFailed = true;
                        reject(reason);
                        //return $q.defer().reject(reason);
                    });
                });
            });

            return promise;
        };

        factory.authenticate = function (username, password, keepLoggedIn) {
            // the API gives a 200 response-code with Error-text if we pass null, but 400 if we pass empty string.
            if (typeof username === "undefined" || username === null) { username = "" };
            if (typeof password === "undefined" || password === null) { password = "" };

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
                    "Tags": ['version:' + $rootScope.version]
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

            $rootScope.$broadcast('authenticating');

            var promise = factory.httpPost(appAuthenticate);
            promise.then(function (greeting) {
                //Success
                logService.log('Success appuser authentication');
                logService.log(greeting);
                //TODO: logged in now
                factory.saveLoginCredentials(username, password, true);
                setCredentialsAndLogin(greeting);
                $rootScope.$broadcast('authentication-success');
            }, function (reason) {
                //failed try authenticate against admin
                logService.log('Failed App authentication, trying with admin');
                logService.log(reason);
                promise = factory.httpPost(adminAuthenticate);
                promise.then(function (greeting) {
                    //Admin authenticate success
                    logService.log('Success admin authenticate now authenticating towards app');
                    logService.log(greeting);
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
                        },
                        "Tags": ['version:' + $rootScope.version]
                    };
                    promise = factory.httpPost(appTokenAuthentication);
                    promise.then(function (greeting) {
                        //Success
                        logService.log('Success admin-> app');
                        logService.log(greeting);
                        //TODO: logged in now
                        factory.saveLoginCredentials(username, password, true);
                        setCredentialsAndLogin(greeting);
                        $rootScope.$broadcast('authentication-success');
                    }, function (reason) {
                        //failed try authenticate against admin->app
                        logService.log('Failed login admin-> app');
                        logService.log(reason);
                        //TODO:go back to login
                        $state.go('login');
                        //we are logged in show navbar and redirect
                        $('#template-2').hide();
                        $rootScope.$broadcast('authentication-failed');
                    });

                }, function (reason) {
                    //failed try authenticate against admin
                    logService.log('Failed login admin');
                    logService.log(reason);
                    //go back to login
                    //TODO:go back to login
                    $state.go('login');
                    //we are logged in show navbar and redirect
                    $('#template-2').hide();
                    $rootScope.$broadcast('authentication-failed');
                });
            });
        };

        factory.httpPost = function (req) {

            var timerFunction = function () {
                var deferred = $q.defer();
                deferred.resolve(new Date().getTime());
                return deferred.promise;
            }

            var promises = [timerFunction(), factory.httpPostOriginal(req)];

            return $q.all(promises).then(function (values) {
                var elapsedTime = (new Date().getTime() - values[0]);
                //var elapsedTime = (values[1].debug.executionTime);
                var logString = "[ " + elapsedTime + " ms ] " + (values[1].requestUrl) + " ";

                var timedResponse = { timeStamp: values[0], elapsedTime: elapsedTime, url: values[1].requestUrl, response: values[1] };
                // Insert log item and limit logging to 50 posts
                timerResults.unshift(timedResponse);
                timerResults = timerResults.slice(0, 50);

                // Broadcast event to state slow connections.
                if (elapsedTime > 2000 || (elapsedTime > 1000 && elapsedTime > (timersAverage * 1.3) && timerResults.length > 10)) {
                    $rootScope.$broadcast('slow-http-request-detected', timedResponse);
                }
                return values[1];
            });
        }

        factory.httpPostOriginal = function (req,dontRetry) {
            var deferred = $q.defer();

            $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                logService.log(response);
                if (response.data.status === 401 || response.data.status === "Unauthorized") {
                    logService.log(new LogObject("success callback - user unauthorized"));
                    logService.log(new LogObject(response));

                    if (factory.getLoginCredentials() !== null) {

                        factory.justAuthenticate(factory.getLoginCredentials().username, factory.getLoginCredentials().password)
                            .then(function(success) {
                                logService.log(new LogObject("justAuthenticate successfully ran now re running http post"));
                                factory.httpPostOriginal(req).then(function(success) {
                                    deferred.resolve(success);
                                }, function(error) {
                                    deferred.reject(error);
                                });
                            }, function(error) {
                                deferred.reject(error);
                            });

                    } else {
                        console.log("logging out");
                        $rootScope.logout();
                    }
                    //retry
                } else {
                    deferred.resolve(response);
                }
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //logService.log(response); // TODO: REMOVE! only for debugging.
                if(response.status === 401 || response.status === 'Unauthorized'){
                    logService.log(new LogObject("error callback - user unauthorized"));
                    logService.log(new LogObject(response));
                    if(factory.getLoginCredentials() !== null){

                        factory.justAuthenticate(factory.getLoginCredentials().username, factory.getLoginCredentials().password)
                            .then(function (success){
                                logService.log(new LogObject("justAuthenticate successfully ran now re running http post"));
                                factory.httpPostOriginal(req);
                        }, function(error){
                        });
                    }
                    else{
                        console.log("logging out");
                        $rootScope.logout();
                    }
                }
                deferred.reject(response.data);
            });
            return deferred.promise;
        };

        factory.registerPushToken = function () {
            logService.log("registerPushToken");

            return window.plugins.pushNotification.getPushToken(function(token) {
                logService.log("registering pushtoken: "+token);
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
                            HardwareId: factory.getDeviceId(),
                            PushToken: token,
                            DeviceType: window.deviceType,
                            MacAddress: null
                        },
                        "AuthenticationToken": factory.getAuthToken(),
                        "Tags": null
                    }
                };

                return $http(req).then(function successCallback(response) {
                    logService.log("registerPushToken update success");
                    $rootScope.$broadcast('push-token-registered', response);
                    return response;
                }, function errorCallback(response) {

                    logService.error("registerPushToken update error");
                    logService.error(response);

                    return $q.reject(response);
                });
            });
        };

        factory.unRegisterPushToken = function () {
            if (factory.getDeviceId() != null) {
                var req = {
                    method: 'POST',
                    url: factory.currentAppApiUrl + 'app/users/unregister-device',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        "Data": {
                            HardwareId: factory.getDeviceId()
                        },
                        "AuthenticationToken": factory.getAuthToken(),
                        "Tags": null
                    }
                };

                return $http(req).then(function successCallback(response) {
                    return response;
                }, function errorCallback(response) {

                    logService.log("unRegisterPushToken error");
                    logService.log(response);

                    return $q.reject(response);
                });
            }
        };

        // Get
        factory.keepLoggedInCredentialsFromDatabase = function () {
            var data = {
                keepLoggedIn: false,
                username: "",
                password: ""
            };
            var keepLoggedInCredentials = JSON.parse(localStorage.getItem("keepLoggedInCredentials"));
            if (typeof keepLoggedInCredentials !== "undefined" && keepLoggedInCredentials !== null) {
                data = keepLoggedInCredentials;
            }
            return data;
        }

        factory.userDetailsFromDatabase = function () {
            var data = {
                displayName: "-",
                administratorId: null,
                accountId: null,
                token: null,
                appUserId: null

            };
            var userDetails = JSON.parse(localStorage.getItem("userDetails"));
            if (typeof userDetails !== "undefined" && userDetails !== null) {
                data = userDetails;
            }
            return data;
        }

        userDetails = factory.userDetailsFromDatabase();

        factory.getUsername = function () {
            return userDetails.displayName;
        };

        factory.getFirstName = function () {
            return userDetails.firstName;
        };

        factory.getLastName = function () {
            return userDetails.lastName;
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

        factory.getEmailAddress = function () {
            return userDetails.emailAddress;
        };

        factory.getDeviceId = function () {
            var deviceId = typeof device != 'undefined' ? device.uuid : null;
            factory.saveToDb('deviceId', deviceId);
            return deviceId;
        };

        // Save

        factory.saveToDb = function (key, value) {
            var valueAsJson = JSON.stringify(value);
            localStorage.setItem(key, valueAsJson);
        };

        factory.loadFromDb = function (key) {
            return JSON.parse(localStorage.getItem(key));
        };

        factory.saveLoginCredentials = function (username, password, keepLoggedIn) {
            if (keepLoggedIn) {
                var keepLoggedInCredentials = {
                    keepLoggedIn: true,
                    username: username,
                    password: password
                }
                factory.saveToDb("keepLoggedInCredentials", keepLoggedInCredentials);
            } else {
                factory.saveToDb("keepLoggedInCredentials", null);
            }
        }

        // Clear

        factory.getLoginCredentials = function () {
           return factory.loadFromDb("keepLoggedInCredentials");
        }

        factory.clearLoginCredentials = function () {
            factory.saveToDb("keepLoggedInCredentials", false);
        }

        factory.clearTokenData = function () {
            factory.saveToDb("userDetails", null);
        }

        factory.clearLocalStorage = function () {
            localStorage.clear();
        }

        factory.on = function (event, args) {
            switch (event.name) {
                case 'push-service-initialized':
                    // check not empty
                  //  insertPushTokenClearTableFirst(args.token);
                    break;
                case 'logged-out':
                    // Clearing Table on logout, just to be srure
                 //   dropPushTokensTable().then(function (success) { logService.error('Dropped pushTokens table.') }, function (error) { logService.error('Could not drop pushTokens table.') });
                    break;
                default:
                    break;
            }
        }

        /**
         * When the service is runned, depending on what url mobile response uses we set the api address differently
         * @param host
         * @returns {*}
         */
        factory.getApiUrl = function (host) {
            return "http://apitest.aws.mobileresponse.se/";
            // in test
            if (host.pathname.indexOf("/test") > -1)
                return "http://api2.test.mobileresponse.se/";

            // in production
            if (host.pathname.indexOf("/production") > -1)
                return "https://api2.mobileresponse.se/";

            // in localhost
            if (host.host.indexOf("localhost") > -1)
                //return "http://10.100.126.80:8887/";
                //return "http://api2.test.mobileresponse.se/";
                return "http://api2.test.mobileresponse.se/";
            // in staging
            return "http://api2.test.mobileresponse.se/";
        };

        /**
         * When the service is runned, depending on what url mobile response uses we set the api address differently
         * @param host
         * @returns {*}
         */
        factory.getAppApiUrl = function (host) {
            return "http://apitest.aws.mobileresponse.se/";
            // in test
            if (host.pathname.indexOf("/test") > -1)
                return "http://api.test.mobileresponse.se/";

            // in production
            if (host.pathname.indexOf("/production") > -1)
                return "https://api.mobileresponse.se/";

            // in localhost
            if (host.host.indexOf("localhost") > -1)
                return "http://api.test.mobileresponse.se/";
            // in staging
            return "http://api.test.mobileresponse.se/";
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

     //   factory.keepTokenAlive();

        return factory;
    }]);


var timerResults = [];

var timersAverage = function () {
    var sum = 0;
    for (var i = 0; i < timerResults.length; i++) {
        sum += parseInt(timerResults[i].elapsedTime, 10);
    }

    var avg = sum / timerResults.length;
    return avg;
}

var listHttpTimers = function (limit, sortAscending) {
    if (typeof limit != "number") { limit = 10; }
    var resultArr = [];
    var result = "";
    var sorted = timerResults.sort(function (a, b) {
        if (a.elapsedTime > b.elapsedTime) { return sortAscending ? 1 : -1; }
        if (a.elapsedTime < b.elapsedTime) { return sortAscending ? -1 : 1; }
        return 0;
    });
    resultArr = sorted.slice().splice(0, limit);

    logService.log("\n---- Listing top [" + resultArr.length + "] http requests by execution time " + (sortAscending ? "ASCENDING" : "DESCENDING") + "----\n\n");
    for (var entry in resultArr) {
        result += new Date(resultArr[entry].timeStamp) + " [" + resultArr[entry].elapsedTime + " ms] > " + resultArr[entry].url + "\n";
    }
    result += "\n\n";
    logService.log(result);
};