mrApp.controller('LogoutController', [
    '$rootScope', '$localStorage', '$location', '$window', '$timeout', 'DeviceFactory',
    function ($rootScope, $localStorage, $location, $window, $timeout, deviceFactory) {

        function init() {
            console.log("LOGOUT");
            $rootScope.keepMeSignedIn = false;
            $localStorage.savedCredentials.keepMeSignedIn = $rootScope.keepMeSignedIn;
            $rootScope.authenticationToken = undefined;

            deviceFactory.unregisterDevice(
                function(status) {
                    console.log("unregisteredDevice success");
                },
                function(status) {
                    console.log("unregisteredDevice error");
                });

            $timeout(function () {
                $location.path('/login');
                $window.location.reload();
            }, 2000);
        }

        init();
    }
]);

