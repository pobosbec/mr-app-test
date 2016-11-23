angular.module('deviceReady', [])
    .factory('deviceReady',
        function () {

            return function (done) {
                if (typeof window.cordova === 'object') {
                    document.addEventListener('deviceready', function() {
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




