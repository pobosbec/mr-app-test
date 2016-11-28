angular.module('DeviceFactory', [])
    .factory('DeviceFactory', ['ApiFactory', function (apiFactory) {

            var deviceToken = null;

            function isAndroid() {
                return navigator.userAgent.indexOf("Android") > 0;
            }

            function isIOS() {
                return (navigator.userAgent.indexOf("iPhone") > 0 ||
                    navigator.userAgent.indexOf("iPad") > 0 ||
                    navigator.userAgent.indexOf("iPod") > 0);
            }

            function registerPushwooshAndroid(settings, callback, error) {
                var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");

                //set push notifications handler
                document.addEventListener('push-notification',
                    function(event) {
                        var title = event.notification.title;
                        var userData = event.notification.userdata;

                        alert("[Android] PUSH: " + event.notification);

                        if (typeof (userData) != "undefined") {
                            console.warn('user data: ' + JSON.stringify(userData));
                        }

                        settings.onPush(event);
                    }
                );

                pushNotification.onDeviceReady({ projectid: settings.projectid, appid: settings.appid });

                //register for push notifications
                pushNotification.registerDevice(
                    function(token) {
                        console.log('pushNotification.registerDevice token: ' + token);
                        callback(token);
                    },
                    function(status) {
                        error(status);
                    }
                );
            }

            function registerPushwooshIOS(settings, callback, error) {

                var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");

                //set push notification callback before we initialize the plugin
                document.addEventListener('push-notification',
                    function(event) {
                        alert("New push iOS");
                        var notification = event.notification;
                        pushNotification.setApplicationIconBadgeNumber(0);

                        settings.onPush(event);
                    }
                );

                pushNotification.onDeviceReady({ pw_appid: settings.appid });

                pushNotification.registerDevice(
                    function(token) {
                        var deviceToken = token.pushToken;
                        callback(deviceToken);
                    },
                    function(status) {
                        error(status);
                    }
                );
            }

            function registerDeviceInMobileResponse() {
                // register device 
                var registerDeviceRequest = {
                    authenticationToken: apiFactory.getToken(),
                    data: {
                        instanceName: apiFactory.apiSettings.instanceName,
                        userId: apiFactory.myAppUser.appUserId,
                        hardwareId: '',
                        pushToken: deviceToken,
                        deviceType: deviceType(),
                        macAddress: ''
                    }
                };
                apiFactory.functions.call('users/register-device',
                    registerDeviceRequest,
                    function (response) {
                        alert("Device registered in Mobile Response");
                        console.log(response);
                    },
                    function (error) {
                        alert("Device registered failed in Mobile Response");
                        console.log(error);
                    });
            }

            function registerDevice(settings, callback) {
                if (isDevice()) {

                    document.addEventListener('deviceready',
                        function() {

                            var afterRegisterSuccess = function(token) {
                                deviceToken = token;
                                alert("Register success");
                                registerDeviceInMobileResponse();
                                callback(true);
                            };

                            var afterRegisterFail = function() {
                                alert("Register failed");
                                callback(false);
                            };

                            if (isAndroid()) {
                                //alert("Android");
                                registerPushwooshAndroid(settings, afterRegisterSuccess, afterRegisterFail);
                            }

                            if (isIOS()) {
                                //alert("iOS");
                                registerPushwooshIOS(settings, afterRegisterSuccess, afterRegisterFail);
                            }


                        });
                } else {
                    callback(false);
                }
            }

            function isDevice() {
                if (typeof window.cordova === 'object') {
                    return true;
                } else {
                    return false;
                }
            }

            function getDeviceType() {
                if (isDevice()) {
                    if (isAndroid()) {
                        return "Android";
                    }
                    else if (isIOS()) {
                        return "iOS";
                    } else {
                        return "Other";
                    }

                } else {
                    return "Web";
                }
            }

            return {
                registerDevice: registerDevice,
                isDevice: isDevice,
                getDeviceType: getDeviceType
            };

        }
    ]);