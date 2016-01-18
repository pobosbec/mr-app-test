﻿function LoginController(apiFactory, $rootScope, $scope, $location, $window, $routeParams, $localStorage, usersFactory) {

    var command = $routeParams.param1;
    
    if (command == "logout") {
        logout();
    }

    $scope.saveCredentials = true;
    
    $scope.error = {
        show: false,
        message: ''
    };

    function init() {
        $scope.credentials = $localStorage.savedCredentials;
    }
    
    $scope.signin = {
        show: true,
        error: {
            show: false,
            message: ''
        }
    };

    $scope.ClearCredentials = function () {
        //console.log("Cleared credentials");
        $localStorage.savedCredentials = null;
        $scope.credentials = null;
    };

    $scope.registration = {
        show: false,
        error: {
            show: false,
            message: ''
        }
    };

    $scope.ShowSignin = function() {
        $scope.registration.show = false;
        $scope.signin.show = true;
    };

    $scope.ShowRegistration = function () {
        $scope.registration.show = true;
        $scope.signin.show = false;
    };

    function clearRegistration() {
        $scope.register.userName = null;
        $scope.register.password = null;
        $scope.register.password2 = null;
    }
    
    $scope.ClearRegistration = function () {
        clearRegistration();
    };

    $scope.Register = function () {

        if (!$scope.registrationForm.$invalid) {
        
            var userName = $scope.register.userName;
            var password = $scope.register.password;
            var password2 = $scope.register.password2;
            
            if (password != password2) {
                $scope.registration.error.show = true;
                $scope.registration.error.message = "Passwords don't match";
                $scope.register.password2 = null;
                return false;
            }

            usersFactory.registerUser(apiFactory.apiSettings.instanceName, userName, password, function (response) {
                console.log("SUCCESS: Register response");
                console.log(response);

                if (response.data.userId != null) {
                    var newUserId = response.data.userId;
                    login(apiFactory.apiSettings.instanceName, userName, password, function(response) {
                        $location.path('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/profile/' + newUserId);
                        return true;
                    }, function(error) {
                        
                    });
                }
                
            }, function (error) {
                $scope.registration.error.show = true;
                $scope.registration.error.message = error[0].errorMessage;
            });

        }
    };

    function login(instanceName, userName, password, callback, error) {
        if (!$scope.signinForm.$invalid) {

            var credentials = {
                'instanceName': instanceName,
                'UserName': userName,
                'Password': password
            };
            apiFactory.functions.authenticate(credentials, function(response) {

                if (response != null) {

                    if ($scope.saveCredentials) {
                        $localStorage.savedCredentials = {
                            'userName': userName,
                            'password': password
                        };
                        //console.log("Saved credentials");
                    }

                    $rootScope.authenticationToken = response;
                    usersFactory.getUser(apiFactory.myAppUser, function (response) {
                        $rootScope.myAppUser = response;
                        //console.log($rootScope.myAppUser);

                        //// register device 
                        //var registerDeviceRequest = {
                        //    authenticationToken: apiFactory.getToken(),
                        //    data: {
                        //        instanceName: apiFactory.apiSettings.instanceName,
                        //        userId: apiFactory.myAppUser.appUserId,
                        //        hardwareId: 'XXX-YYY',
                        //        pushToken: 'XXX-YYY',
                        //        deviceType: 'Nokia',
                        //        macAddress: '01:02:03:04:05:06:07'
                        //    }
                        //};
                        //apiFactory.functions.call('users/register-device', registerDeviceRequest, function(response) {
                        //    console.log(response);
                        //}, function(error) {
                        //    console.log(error);
                        //});
                        callback(response);

                    }, function(error) {

                    });
                   
                }
            }, function(e) {
                
                $scope.error.message = "Login failed! User does not exist";

                if (e.status == 401) {
                    $scope.error.message = "Login failed! Password is incorrect";
                }

                $scope.error.show = true;
                console.log("Login failed");

                error(e);
            });
        }
    }

    $scope.Login = function() {
        login(apiFactory.apiSettings.instanceName, $scope.credentials.userName, $scope.credentials.password, function(response) {
            $location.path('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/main');
        }, function(error) {
            $location.path('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/login');
        });
    };

    function logout() {
        $location.path('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/login');
        $window.location.reload();
    }

    $scope.Logout = function() {
        logout();
    };

    init();

}
