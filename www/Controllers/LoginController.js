﻿mrApp.controller('LoginController', [
    'ApiFactory', '$rootScope', '$scope', '$location', '$window', '$routeParams', '$localStorage', 'UsersFactory', 'DeviceFactory', 'SettingsFactory', 'SharedState',
    function (apiFactory, $rootScope, $scope, $location, $window, $routeParams, $localStorage, usersFactory, deviceFactory, settingsFactory, SharedState) {
        
        var command = $routeParams.param1;

        if (command === "logout") {
            logout();
        }
        
        $scope.saveCredentials = true;
        $scope.keepMeSignedIn = true;
        $scope.signingin = false;

        $scope.error = {
            show: false,
            message: ''
        };

        function init() {
            $scope.$emit('viewChanged', 'login');
            settingsFactory.initSettings();
            $scope.credentials = $localStorage.savedCredentials;

            if ($localStorage.showIntro === undefined || $localStorage.showIntro) {
                // show intro...
                SharedState.initialize($scope, 'introModal', '');
                SharedState.turnOn('introModal');
            } else {
                if ($scope.credentials != null && $scope.credentials.keepMeSignedIn) {
                    login();
                }
            }

        }

        $scope.signin = {
            show: true,
            error: {
                show: false,
                message: ''
            }
        };

        function setSigningIn(state) {
            //is signing in
            if (state) {

            } else {
                
            }
            $scope.signingin = state;
        }

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

        $scope.ShowSignin = function () {
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
                        login(apiFactory.apiSettings.instanceName, userName, password, function (response) {
                            $location.path('/profile/' + newUserId);
                            return true;
                        }, function (error) {

                        });
                    }

                }, function (error) {
                    $scope.registration.error.show = true;
                    $scope.registration.error.message = error[0].errorMessage;
                });

            }
        };

        function apiLogin(instanceName, userName, password, callback, error) {

            var credentials = {
                'instanceName': instanceName,
                'UserName': userName,
                'Password': password
            };
            apiFactory.functions.authenticate(credentials,
                function (response) {

                    if (response != null) {

                        if ($scope.saveCredentials) {
                            $localStorage.savedCredentials = {
                                'userName': userName,
                                'password': password,
                                'keepMeSignedIn': $scope.keepMeSignedIn
                            };
                            //console.log("Saved credentials");
                        }
                        $rootScope.keepMeSignedIn = $scope.keepMeSignedIn;
                        $rootScope.authenticationToken = response;
                        usersFactory.getUser(apiFactory.myAppUser,
                            function (response) {
                                $rootScope.myAppUser = response;
                                //console.log($rootScope.myAppUser);

                                // registerDevice ---
                                var registerDeviceRequest = {
                                    "appid": "A014B-AC83E",
                                    "projectid": "482590317251",
                                    "onPush": function(push) {
                                        console.log("RootBroadcast: newPush");
                                        $rootScope.$broadcast('newPush', push);
                                    },
                                    "onResume": function() {
                                        console.log("RootBroadcast: appResumed");
                                        $rootScope.$broadcast('appResumed', true);
                                    }
                                };

                                if (deviceFactory.isDevice) {
                                    deviceFactory.registerDevice(registerDeviceRequest,
                                        function (status) {
                                            if (status) {
                                                //alert("Device registered");
                                            } else {
                                                //alert("Device not registered"); 
                                            }
                                            callback(response);
                                        });
                                }
                                

                            },
                            function (e) {
                                error(e);
                            });

                    }
                },
                function (e) {

                    $scope.signin.error.message = "Login failed! User does not exist";

                    if (e.status === 401) {
                        $scope.signin.error.message = "Login failed! Password is incorrect";
                    }

                    $scope.signin.error.show = true;
                    console.log("Login failed");

                    error(e);
                });

        }

        function login() {
            console.log('--- LOGIN ---');
            setSigningIn(true);
            apiLogin(apiFactory.apiSettings.instanceName,
                $scope.credentials.userName,
                $scope.credentials.password,
                function(response) {
                    setSigningIn(false);

                    if (response.email == null && response.phoneNumber == null) {
                        $location.path('/profile/' + response.id);
                    }

                    if ($rootScope.currentInboxId != undefined) {
                        $location.path('/conversations/' + $rootScope.currentInboxId);
                    } else {
                        $location.path('/main');
                    }
                },
                function(error) {
                    setSigningIn(false);
                    $location.path('/login');
                });
        }

        $scope.Login = function () {
            if (!$scope.signinForm.$invalid) {
                login();
            }
        };


        //function logout() {
        //    $scope.keepMeSignedIn = false;
        //    $localStorage.savedCredentials.keepMeSignedIn = $scope.keepMeSignedIn;
        //    $rootScope.authenticationToken = undefined;
        //    $location.path('/login');
        //    $window.location.reload();
        //}

        //$scope.Logout = function () {
        //    logout();
        //};

        init();

    }

]);

