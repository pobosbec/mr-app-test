mrApp.controller('LogoutController', [
    '$rootScope', '$localStorage', '$location', '$window', '$timeout', 'DeviceFactory',
    function ($rootScope, $localStorage, $location, $window, $timeout, deviceFactory) {

        function afterLogout(delayTime) {
            $timeout(function () {
                $location.path('/login');
                $window.location.reload();
            }, delayTime);
        }

        function init() {
            console.log("LOGOUT");
            $rootScope.keepMeSignedIn = false;
            $localStorage.settings.savedCredentials.keepMeSignedIn = $rootScope.keepMeSignedIn;
            $rootScope.authenticationToken = undefined;

            if (deviceFactory.isDevice()) {
                deviceFactory.unregisterDevice(
                    function(status) {
                        //alert("unregisteredDevice success");
                        console.log("unregisteredDevice success");
                        afterLogout(3000);
                    },
                    function(status) {
                        //alert("unregisteredDevice error");
                        console.log("unregisteredDevice error");
                        afterLogout(3000);
                    });

            } else {
                afterLogout(3000);
            }
            
        }

        init();
    }
]);

