/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('login', [])
    .controller('loginCtrl', ['$scope', '$rootScope', '$http', 'tokenService', function ($scope, $rootScope, $http, tokenService) {

        //taken from main.js
        this.login = 1;
        this.register = 0;
        this.forgot = 0;

        $scope.showLoginError = false;
        $scope.errorMsg = "";
        $scope.keepMeLoggedInAtStartup = JSON.parse(localStorage.getItem("keepLoggedIn"));
        $scope.keepLoggedIn = JSON.parse(localStorage.getItem("keepLoggedIn"));

        $scope.login = function (data) {
            //if theres something in the input field try to authenticate
            if (!((data.username == "" || data.username == null))) {
                tokenService.authenticate(data.username,data.password);
            }
            //nothing in the inputfields use the hard coded user
            else {
            }
        };

        /**
         * Calls api for authentication call, sets token and admin id
         * @param username
         * @param password
         */
        function authenticate(username, password, keepLoggedIn) {

            var req = {
                method: 'POST',
                url: tokenService.currentApiUrl + 'authenticate',
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

            $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                var token = response.data.data.id;
                tokenService.saveToDb("authToken", token);
                $scope.showLoginError = false;
                tokenService.isAuthenticated(token).then($rootScope.$broadcast("logged-in"));
                if (keepLoggedIn) {
                    tokenService.saveToDb("keepLoggedIn", true);
                    tokenService.saveToDb("keepLoggedInUser", username);
                    tokenService.saveToDb("keepLoggedInPassword", password);
                }

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                $scope.showLoginError = true;
                console.log(response); // TODO: REMOVE! only for debugging.


                $scope.keepMeLoggedInAtStartup = false;
                tokenService.saveToDb("keepLoggedIn", false);
                tokenService.saveToDb("keepLoggedInUser", null);
                tokenService.saveToDb("keepLoggedInPassword", null);

                if (response.data != null) {
                    if (response.data.errors[0].errorMessage.indexOf("AuthenticationToken") > -1) {
                        $scope.errorMessage = "Wrong Username / Password";
                    }
                } else {
                    $scope.errorMessage = "Error";
                }
            });
        }

        function keepLoggedInData() {
            var data = {
                keepLoggedIn: JSON.parse(localStorage.getItem("keepLoggedIn")),
                keepLoggedInUser: JSON.parse(localStorage.getItem("keepLoggedInUser")),
                keepLoggedInPassword: JSON.parse(localStorage.getItem("keepLoggedInPassword"))
            }
            return data;
        }

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

        if ($scope.keepMeLoggedInAtStartup) {
            console.warn("auto-logging in");
            $scope.login(keepLoggedIn());
        } else {
            // DIE!
            tokenService.clearLocalStorage();
        }

    }]);