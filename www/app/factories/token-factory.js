/**
 * Created by robinpipirs on 11/12/15.
 */

angular.module('token', [])
    .factory('tokenService', ['$http','$window','$rootScope','$location','$q','$state', function($http, win, $rootScope, $location, $q,$state) {
        $rootScope.token = null;
        var username = null;
        var token = null;
        var adminId = null;
        var accountId = null;
        var wfId = null;
        var factory = {};

        var aquiredUserName = false;


        //development mode
        $rootScope.showDev = false;

        //the instance of the Timeout event that run keepTokenAlive
        var tokenTimer;
        //The interval which keepTokenAlive should be runned
        var interval = 1000000;


        /**
         *
         * Checks if theres an token in the sessionStorage if so authenticate it
         *
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
         *
         * checks if the user opens the page with a passed token. if so try to authenticate with it.
         *
         */

        var location = $location;
        $rootScope.$watch('location.search()', function() {
            var token = ($location.search()).token;
            if (token != null){
                factory.isAuthenticated(token);
            }
        }, true);

        /**
         *
         * Logout function
         *
         */

        $rootScope.logout = function(){


            //TODO abandon function

            factory.abandonToken($rootScope.token);
            win.sessionStorage.accessToken = null;
            $rootScope.token = null;
            token = null;

            $state.go('login');
            clearTimeout(tokenTimer);

            $('#template-2').hide();

            aquiredUserName = false;



        };



        factory.setWfId = function (data){
            wfId = data;
        };

        factory.getWfId = function (){
            return wfId;
        };

        /**
         *
         * function that increments our tokens expire time
         *
         * @var interval here you can set the interval time for refresh 1000 = 1s, 60000 = 1min
         *
         */
        factory.keepTokenAlive = function (){

            factory.isAuthenticated(token);

        };





        /**
         *
         * Calls api /is-authenticated with data as token this call also refreshes the lifetime of the token
         * @param data token
         */
        factory.abandonToken = function(data){


            var req = {
                method: 'POST',
                url: factory.currentApiUrl+ 'is-authenticated',
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


        /**
         *
         * Calls api /is-authenticated with data as token this call also refreshes the lifetime of the token
         * @param data token
         */
        factory.isAuthenticated = function(data){

            token = data;

            var req = {
                method: 'POST',
                url: factory.currentApiUrl+ 'is-authenticated',
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

                if(!aquiredUserName){
                    aquiredUserName = !aquiredUserName;
                    factory.getDetails();
                }

                    //start keepTokenAlive timer
                    tokenTimer = setTimeout(function(){factory.keepTokenAlive}, interval);

                //show navbar
                $('#template-2').show();

                //store token in session
                win.sessionStorage.accessToken = token;

                //redirect to dashboard
                if ($state.includes('login')){

                    $state.go('home');
                }


                return response;

            }, function errorCallback(response) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.

                //store token in session
                win.sessionStorage.accessToken = null;

                //redirect to login
                //change to dashboard
                $state.go('login');

                //we are logged in show navbar and redirect
                $('#template-2').hide();

                });
            return $q.reject(response);
        };




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

        factory.getUsername = function() {
            return username;
        };


        factory.getAdminId = function() {
            if (adminId === null) {
                var refreshIds = factory.refreshIds();
                refreshIds.then(function(response) {
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

        factory.getAuthToken = function() {
            return token;
        };


        /**
         *
         * When the service is runned, depending on what url mobile response uses we set the admin address differently
         * @param host
         * @returns {*}
         */


        factory.getWfUrl = function (host)
        {
            // in test
            if (host.indexOf("test.mobileresponse") > -1)
                return "http://admin.test.mobileresponse.se/";

            // in production
            if (host.indexOf("mobileresponse.se") > -1)
                return "https://admin.mobileresponse.se/";

            // in localhost
            if (host.indexOf("localhost:63342") > -1)
                return "http://api2.mobileresponse.se/";

            // in localhost
            else if (host.indexOf("localhost") > -1)
                return "http://admin.test.mobileresponse.se/";

            // in staging
            return "https://admin.mobileresponse.se/";
        };

        /**
         * Instancing our adminurl to the browsers
         * @type {*}
         */
        factory.currentwfUrl = factory.getWfUrl(window.location.host);



        /**
         *
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
            return "http://api2.test.mobileresponse.se/";
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
        factory.currentApiUrl = factory.getApiUrl(window.location);
        factory.currentDeviceServiceUrl = factory.getDeviceServiceUrl(window.location);
        factory.currentReservationServiceUrl = factory.getReservationServiceUrl(window.location);
        return factory;

    }])
