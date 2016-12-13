mrApp.controller('SettingsController',
[
    '$scope','SettingsFactory',
    function ($scope, settingsFactory) {

        $scope.numberOfConversations = 10;
        $scope.numberOfMessages = 10;

        $scope.SaveSettings = function () {
            settingsFactory.setNumberOfConversations($scope.numberOfConversations);
            settingsFactory.setNumberOfMessages($scope.numberOfMessages);
        };

        function init() {
            $scope.numberOfConversations = settingsFactory.getNumberOfConversations();
            $scope.numberOfMessages = settingsFactory.getNumberOfMessages();
        }
        
        init();

    }
]);