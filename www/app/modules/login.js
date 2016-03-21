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
        $scope.keepLoggedIn = JSON.parse(localStorage.getItem("keepLoggedInCredentials"));

        $scope.login = function (data) {
            //if theres something in the input field try to authenticate
            if (!((data.username === "" || data.username === null))) {
                tokenService.authenticate(data.username,data.password,data.keepLoggedIn);
            }
            //nothing in the inputfields use the hard coded user
            else {
            }
        };
        
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
            $scope.login(tokenService.keepLoggedInCredentialsFromDatabase());
        } else {
            // In non-keepLoggedIn MR-App, localStorage Clears YOU!
            tokenService.clearLocalStorage();
        }

    }]);