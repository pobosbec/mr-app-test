mrApp.controller('SettingsController',
[
    '$scope','$timeout','SettingsFactory',
    function ($scope,$timeout, settingsFactory) {

        $scope.successText = null;
        $scope.errorText = null;

        function showAlert(text, type, duration) {
            if (type === 'success') {
                $scope.successText = text;
                $timeout(function () {
                    $scope.successText = null;
                }, duration);
            }
            if (type === 'error') {
                $scope.errorText = text;
                $timeout(function () {
                    $scope.errorText = null;
                }, duration);
            }

        }

        $scope.numberOfConversations = 10;
        $scope.numberOfMessages = 10;

        $scope.SaveSettings = function () {
            settingsFactory.setNumberOfConversations($scope.numberOfConversations);
            settingsFactory.setNumberOfMessages($scope.numberOfMessages);
            showAlert('Settings saved', 'success', 5000);
        };

        function init() {
            $scope.numberOfConversations = settingsFactory.getNumberOfConversations();
            $scope.numberOfMessages = settingsFactory.getNumberOfMessages();
        }
        
        init();

    }
]);