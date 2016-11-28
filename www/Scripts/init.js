angular.module('deviceReady', [])
    .factory('deviceReady',
        function () {

            function isAndroid() {
                return navigator.userAgent.indexOf("Android") > 0;
            }

            function isIOS() {
                return (navigator.userAgent.indexOf("iPhone") > 0 || navigator.userAgent.indexOf("iPad") > 0 || navigator.userAgent.indexOf("iPod") > 0);
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




