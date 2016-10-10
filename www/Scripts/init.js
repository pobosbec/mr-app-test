
var mrApp = angular.module('mrApp', [
    'ngCordova',
    'ngRoute',
    'ngStorage',
    'ApiFactory',
    'mobile-angular-ui',
    'ngSanitize',
    'UsersFactory',
    'ConversationsFactory'
]);

mrApp.run(function () {
    console.log("--- RUN ---");
});





