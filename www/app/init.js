var mrApp = angular.module('mrApp', ['ngCordova', 'mobile-angular-ui']);

mrApp.controller('MainController',['$scope',
    function($scope) {
        $scope.status = "Angular Working";
    }
]);

mrApp.run(function() {
    console.log("--- RUN ---");
});
