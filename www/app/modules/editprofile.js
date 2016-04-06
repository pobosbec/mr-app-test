/**
 * Created by Robin Jobb on 2016-04-06.
 */
angular.module('profile',[])
    .controller('editProfileCtrl', function ($scope, $http, tokenService,$q) {
        $scope.displayName = tokenService.getUsername();
        $scope.firstName = tokenService.getFirstName();
        $scope.lastName = tokenService.getLastName();
        $scope.email = tokenService.getEmailAddress();
        $scope.verifyMessage = "";

        $scope.$watch( function () { return tokenService.getUsername(); }, function ( displayName ) {
            // handle it here. e.g.:
            $scope.displayName = displayName;
        });

        $scope.verify = function (email) {
            $scope.verifyMessage = "";
            var changeEmail = {
                method: 'POST',
                url: tokenService.currentAppApiUrl + 'app/users/request-change-email-code',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {
                        //"Firstname": firstName,
                        //"Lastname": lastName
                        "EmailAddress": email
                        // "PhoneNumber": "+46123456789",
                        //"Avatar": "http://example.com/avatar.jpg"
                    },
                    "AuthenticationToken": tokenService.getAuthToken(),
                    "Tags": null
                }
            };
            var promise = httpPost(changeEmail);
            promise.then(function (greeting) {
                //Success
                $scope.verifyMessage = "To verify your new email please click the verification link that was sent to your email.";
                $scope.message = greeting.status;
                console.log(greeting);
                //tokenService.refreshUserDetails();

            }, function (reason) {
                //failed updating information
                $scope.verifyMessage = "Error updating email";
                console.log(reason)
            });
        };
        $scope.save = function (firstName, lastName) {
            //if theres something in the input field try to authenticate
            $scope.message = "";
            var changeInfoReq = {
                method: 'POST',
                url: tokenService.currentAppApiUrl + 'app/users/change-information',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "Data": {
                        "Firstname": firstName,
                        "Lastname": lastName
                        //  "EmailAddress": "info@example.com",
                        // "PhoneNumber": "+46123456789",
                        //"Avatar": "http://example.com/avatar.jpg"
                    },
                    "AuthenticationToken": tokenService.getAuthToken(),
                    "Tags": null
                }
            };
            var promise = httpPost(changeInfoReq);
            promise.then(function (greeting) {
                //Success
                $scope.message = greeting.status;
                console.log(greeting);
                tokenService.refreshUserDetails();

            }, function (reason) {
                //failed updating information
                $scope.message = "Error updating information";
                console.log(reason)
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



    });