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
        $scope.keepMeLoggedInAtStartup = JSON.parse(localStorage.getItem("klik"));
        $scope.kli = JSON.parse(localStorage.getItem("klik"));

        $scope.login = function (data) {
            //if theres something in the input field try to authenticate
            if (!((data.username == "" || data.username == null) || (data.password == "" || data.password == null))) {
                authenticate(data.username, data.password, (data.kli || false));
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
        function authenticate(username, password, kli) {

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
                tokenService.isAuthenticated(token);
                $rootScope.$broadcast("logged-in");
                $scope.showLoginError = false;
                if (kli) {
                    tokenService.saveToDb("klik", true);
                    tokenService.saveToDb("kliu", username);
                    tokenService.saveToDb("klip", password);
                }

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                $scope.showLoginError = true;
                console.log(response); // TODO: REMOVE! only for debugging.
                $scope.keepMeLoggedInAtStartup = false;
                tokenService.saveToDb("klik", false);
                tokenService.saveToDb("kliu", null);
                tokenService.saveToDb("klip", null);

                if (response.data != null) {
                    if (response.data.errors[0].errorMessage.indexOf("AuthenticationToken") > -1) {
                        $scope.errorMessage = "Wrong Username / Password";
                    }
                } else {
                    $scope.errorMessage = "Error";
                }
            });
        }

        function kli() {
            var data = {
                kli:        JSON.parse(localStorage.getItem("klik")),
                username:   JSON.parse(localStorage.getItem("kliu")),
                password:   JSON.parse(localStorage.getItem("klip"))
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
            $scope.login(kli());
        }

    }]);