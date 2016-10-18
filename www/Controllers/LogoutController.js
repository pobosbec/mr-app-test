mrApp.controller('LogoutController', [
    '$rootScope', '$localStorage', '$location', '$window', '$timeout',
    function ($rootScope, $localStorage, $location, $window, $timeout) {

        function init() {
            console.log("LOGOUT");
            $rootScope.keepMeSignedIn = false;
            $localStorage.savedCredentials.keepMeSignedIn = $rootScope.keepMeSignedIn;
            $rootScope.authenticationToken = undefined;
            $timeout(function () {
                $location.path('/login');
                $window.location.reload();
            }, 2000);
        }

        init();
    }
]);

