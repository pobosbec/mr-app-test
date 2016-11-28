angular.module('deviceReady', [])
    .factory('deviceReady',
        function () {

            function isAndroid() {
                return navigator.userAgent.indexOf("Android") > 0;
            }

            function isIOS() {
                return (navigator.userAgent.indexOf("iPhone") > 0 || navigator.userAgent.indexOf("iPad") > 0 || navigator.userAgent.indexOf("iPod") > 0);
            }

            function registerPushwooshIOS(callback, error) {

                var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");

                //set push notification callback before we initialize the plugin
                document.addEventListener('push-notification',
                    function(event) {
                        alert("New push iOS");
                        var notification = event.notification;
                        pushNotification.setApplicationIconBadgeNumber(0);
                    }
                );

                pushNotification.onDeviceReady({ pw_appid: "A014B-AC83E" });

                pushNotification.registerDevice(
                    function(token) {
                        alert("iOS: registerDevice: " + JSON.stringify(token));

                        var deviceToken = token.pushToken;
                        callback(deviceToken);
                    },
                    function(status) {
                        //console.warn('failed to register : ' + JSON.stringify(status));
                        alert("iOS: registerDevice: FAILED");
                        error();
                    }
                );
            }

            return function (done) {
                if (typeof window.cordova === 'object') {
                    
                    // is device
                    document.addEventListener('deviceready', function () {
                        if (isAndroid()) {
                            alert("Android");
                        }

                        if (isIOS()) {
                            alert("iOS");
                            registerPushwooshIOS(function(token) {
                                    alert("[iOS] token: " + token);
                                },
                                function (error) {

                                });
                        }

                        done(true);
                    }, false);
                } else {
                    done(false);
                }
            }
        }
    );

var mrApp = angular.module('mrApp', [
    'ngCordova',
    'ngRoute',
    'ngStorage',
    'ApiFactory',
    'mobile-angular-ui',
    'ngSanitize',
    'UsersFactory',
    'ConversationsFactory',
    'deviceReady'
]);

mrApp.run(function () {
    console.log("--- RUN ---");
});

mrApp.filter('trustUrl', ['$sce', function ($sce) {
  return function(url) {
    return $sce.trustAsResourceUrl(url);
  };
}]);




