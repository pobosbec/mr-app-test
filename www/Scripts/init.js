angular.module('deviceReady', [])
    .factory('deviceReady',
        function() {

            function initPushwoosh() {
                if (window.isPhoneGap) {
                    console.log("initPushwoosh, isPhoneGap");
                    if (cordova !== null &&
                        typeof cordova !== "undefined" &&
                        cordova.require !== null &&
                        typeof cordova.require !== "undefined") {
                        if (device.platform == "Android") {
                            console.log("registering Android");
                            registerPushwooshAndroid();
                        }

                        if (device.platform == "iPhone" || device.platform == "iOS") {
                            console.log("registering pushwooshIOS");
                            registerPushwooshIOS();
                        }

                        if (device.platform == "Win32NT") {
                            registerPushwooshWP();
                        }
                    }
                }
            }

            return function(done) {
                if (typeof window.cordova === 'object') {
                    document.addEventListener('deviceready',
                        function() {
                            var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");
                            pushNotification.onDeviceReady({ pw_appid: "A014B-AC83E" });

                            initPushwoosh();
                            done(true);
                        },
                        false);
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




