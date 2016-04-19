/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('login', [])
    .controller('loginCtrl', ['$scope', '$rootScope', '$http', 'tokenService','$q', function ($scope, $rootScope, $http, tokenService,$q) {


        //taken from main.js
        $scope.loginview = true;
        $scope.registerview = false;
        $scope.forgotview = false;


        $scope.showRegister = function(){
            $scope.message="";
            $scope.registerview = true;
            $scope.loginview = false;
            $scope.forgotview = false;
        };
        $scope.showLogin = function(){
            $scope.message="";
            $scope.registerview = false;
            $scope.loginview = true;
            $scope.forgotview = false;
        };
        $scope.showForgot = function(){
            $scope.message="";
            $scope.registerview = false;
            $scope.loginview = false;
            $scope.forgotview = true;
        };

        $scope.message = "";
        $scope.showLoginError = false;
        $scope.errorMsg = "";
        $scope.keepLoggedIn = tokenService.keepLoggedInCredentialsFromDatabase().keepLoggedIn;
        $scope.loggingIn = $scope.keepLoggedIn;

        $scope.login = function (data) {
            $scope.message="";
            //if theres something in the input field try to authenticate
            if (!((data.username === "" || data.username === null))) {
                $scope.loggingIn = true;
                tokenService.authenticate(data.username, data.password, data.keepLoggedIn);
            }
            //nothing in the inputfields use the hard coded user
            else {
            }
        };


        $scope.forgot = function (data) {
            //if theres something in the input field try to authenticate
            $scope.message = "";
            var registerRequest = {
                method: 'POST',
                url: tokenService.currentAppApiUrl + 'app/users/request-change-forgotten-password-code',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {
                        "InstanceName": "mobileresponse",
                        "EmailAdress": data.email
                    },
                    "Tags": null
                }
            };
            var promise = httpPost(registerRequest);
            promise.then(function (greeting) {
                //Success
                console.log(greeting);
                //TODO: wait and go login
                setTimeout(function(){
                    $scope.registerview = false;
                    $scope.loginview = true;
                    $scope.forgotview = false;
                    window.location.reload();
                }, 1500);
            }, function (reason) {
                console.log(reason);
                $scope.message = reason.errors[0].errorMessage;
                //failed try authenticate against admin->app
                $scope.message = "Can't find a user connected to the email provided";
            });
        };

        $scope.register = function (data) {
            //if theres something in the input field try to authenticate
            $scope.message = "";
            var registerRequest = {
                method: 'POST',
                url: tokenService.currentAppApiUrl + 'app/users/register',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {
                        "InstanceName": "mobileresponse",
                        "Username": data.username,
                        "Password": data.password
                    },
                    "Tags": null
                }
            };
            var promise = httpPost(registerRequest);
            promise.then(function (greeting) {
                //Success
                $scope.message = greeting.status;
                //TODO: wait and go login
                setTimeout(function(){
                    $scope.registerview = false;
                    $scope.loginview = true;
                    $scope.forgotview = false;
                    window.location.reload();
                }, 1500);
            }, function (reason) {
                //failed try authenticate against admin->app
                $scope.message = "Username already in use";
            });
        };

         function httpPost  (req) {

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




        $scope.$on('authenticating', function (event, args) {
            $scope.loggingIn = true;
        });

        $scope.$on('authentication-failed', function (event, args) {
            $scope.message = "Invalid username or password.";
            $scope.loggingIn = false;
        });

        $scope.$on('authentication-success', function (event, args) {
            //$scope.loggingIn = false;
        });
        
        /**
         * Used by login-forgot-password.html
         * used to reset password.
         * @param data contains valid administrator username
         */
        $scope.requestPw = function (data) {

            var req = {
                method: 'POST',
                url: tokenService.currentApiUrl + 'administrators/restore-password',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {
                        "Username": data.username
                    },
                    "Tags": null
                }
            };
            $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                $scope.errorMessage = "Success";
                $scope.showLoginError = true;
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                $scope.showLoginError = true;
                if (response.data != null) {
                    if ($scope.errorMessage = response.data.data[1].errorMessage != null) {
                        $scope.errorMessage = response.data.data[1].errorMessage;
                    }
                } else {
                    $scope.errorMessage = "Error";
                }
            });
        }

        if (tokenService.keepLoggedInCredentialsFromDatabase().keepLoggedIn) {
            console.warn("auto-logging in");
            console.log(tokenService.keepLoggedInCredentialsFromDatabase());
            $scope.login(tokenService.keepLoggedInCredentialsFromDatabase());
        } else {
            // In non-keepLoggedIn MR-App, localStorage Clears YOU!
            tokenService.clearLocalStorage();
        }

    }]);