﻿angular.module('DeviceFactory', [])
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
                    function(response) {
                        console.log(response);
                    },
                    function(error) {
                        console.log(error);
                    });
            }

            function registerDevice(settings, callback) {
                if (isDevice()) {

                    document.addEventListener('deviceready',
                        function() {
                            if (isAndroid()) {
                                alert("Android");
                                registerPushwooshAndroid(settings, function(token) {
                                        alert("[Android] token: " + token);
                                        deviceToken = token;
                                    },
                                    function(error) {
                                        alert("Android: registerDevice: FAILED " + error);
                                    });
                            }

                            if (isIOS()) {
                                alert("iOS");
                                registerPushwooshIOS(settings, function(token) {
                                        alert("[iOS] token: " + token);
                                        deviceToken = token;
                                    },
                                    function(error) {
                                        alert("iOS: registerDevice: FAILED " + error);
                                    });
                            }

                            callback(true);
                        },
                        false);
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