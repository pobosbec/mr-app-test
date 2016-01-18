
function ProfileController(apiFactory, $rootScope, $scope, $location, $routeParams, $timeout, usersFactory) {
    
    var appUserId = $routeParams.param1;

    $scope.successText = null;
    $scope.errorText = null;

    function showAlert(text, type, duration) {
        if (type == 'success') {
            $scope.successText = text;
            $timeout(function () {
                $scope.successText = null;
            }, duration);
        }
        if (type == 'error') {
            $scope.errorText = text;
            $timeout(function () {
                $scope.errorText = null;
            }, duration);
        }

    }

    function init() {
        if(appUserId !== undefined) {
            getAppUserDetails(appUserId);
        }
    }

    function getAppUserDetails(appUserId) {
        usersFactory.getUser(appUserId, function(appUser) {
            $scope.myAppUser = appUser;
            //console.log($scope.myAppUser);
            $scope.profile = {
                'firstName': appUser.firstname,
                'lastName': appUser.lastname,
                'email': appUser.email,
                'phone': appUser.phoneNumber,
                'avatar': appUser.avatar
            };
            //console.log($scope.myAppUser);
        }, function(error) {
            showAlert("Unable to get user details", "error", 5000);
        });
    }

    $scope.UpdateProfile = function() {
        usersFactory.updateProfile(
            $scope.profile.firstName,
            $scope.profile.lastName,
            $scope.profile.email, $scope.profile.phone, $scope.profile.avatar, function(response) {
                showAlert("Profile updated!", "success", 5000);
            }, function(error) {
                showAlert("Error saving profile", "error", 5000);
            });
    };

    init();

}