﻿angular.module('ApiFactory', [])
    .factory('ApiFactory', ['$rootScope','$http', function($rootScope, $http) {

            var authenticationToken;
            var lastCallTimestamp;

            var apiSettings = {
                baseApiUrl: 'https://api.mobileresponse.se/app/',
                //baseApiUrl: 'http://api.test.mobileresponse.se/app/',
                instanceName: 'mobileresponse',
                method: 'POST'
            };

            var appUser = {};

            function getAuthenticationToken() {
                return authenticationToken;
            }

            function getLastCallTimestamp() {
                return lastCallTimestamp;
            }

            function authenticate(userCredentials, callback, error) {
                var request = { data: userCredentials };
                //console.log(request);
                call('authenticate',
                    request,
                    function(response) {
                        if (response.data != null) {
                            //console.log(response.data);
                            angular.copy({ appUserId: response.data.appUserId }, appUser);
                            authenticationToken = response.data.id;
                            callback(response.data.id);
                        } else {
                            callback(response.data);
                        }
                    },
                    function(e) {
                        error(e);
                    });
            }

            function call(url, request, callback, error) {
                $rootScope.$broadcast('loading', true);
                $http({
                        url: apiSettings.baseApiUrl + url,
                        method: apiSettings.method,
                        data: request
                    })
                    .then(function (response) {
                        $rootScope.$broadcast('loading', false);
                            //console.log(url);
                            //console.log(response);
                            if (response.data.status === "Unauthorized") {
                                $rootScope.$broadcast('httpUnauthorized', response);
                            }
                            lastCallTimestamp = response.data.time;
                            callback(response.data);
                        },
                        function (e) {
                            $rootScope.$broadcast('loading', false);
                            //console.log('ERROR');
                            //console.log(e);
                            $rootScope.$broadcast('httpCallError', e);
                            error(e);
                        });
            }

            function callReturnId(url, request, callback, error) {
                call(url,
                    request,
                    function(response) {
                        callback(response.data.id);
                    },
                    function(e) {
                        error(e);
                    });
            }

            return {
                getToken: getAuthenticationToken,
                authenticationToken: getAuthenticationToken,
                apiSettings: apiSettings,
                myAppUser: appUser,
                lastCallTimestamp: getLastCallTimestamp,
                functions: {
                    authenticate: authenticate,
                    call: call,
                    callReturnId: callReturnId
                }
            };

        }
    ]);
