'use strict';

var apiFactory = angular.module('ApiFactory', []);
apiFactory.factory('ApiFactory', ['$http', '$timeout', ApiFactory]);

var usersFactory = angular.module('UsersFactory', []);
usersFactory.factory('UsersFactory', ['$http', '$timeout', 'ApiFactory', UsersFactory]);

var conversationsFactory = angular.module('ConversationsFactory', []);
conversationsFactory.factory('ConversationsFactory', ['$http', '$timeout', '$filter', 'ApiFactory', 'UsersFactory', ConversationsFactory]);

var mrApp = angular.module('mrApp', ['ngRoute','ngStorage', 'ApiFactory', 'mobile-angular-ui', 'UsersFactory', 'ConversationsFactory']);

var checkToken = [function ($rootScope, $q, $location) {

    var deferred = $q.defer();

    if ($rootScope.authenticationToken != undefined) {
        deferred.resolve();
    } else {
        $location.path('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/login');
        deferred.reject();
    }

    return deferred.promise;
} ];

mrApp.config(function ($routeProvider) {
    
    $routeProvider.when('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/login', {
        templateUrl: 'http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/Partials/login.htm',
        controller: 'LoginController'
    });

    $routeProvider.when('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/main', {
        templateUrl: 'http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/Partials/main.htm',
        controller: 'MainController',
        resolve: checkToken
    });
   
    $routeProvider.when('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/conversations/:param1', {
        templateUrl: 'http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/Partials/conversations.htm',
        controller: 'ConversationsController',
        resolve: checkToken
    });

    $routeProvider.when('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/newconversation', {
        templateUrl: 'http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/Partials/newConversation.htm',
        controller: 'NewConversationController',
        resolve: checkToken
    });
    
    $routeProvider.when('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/messages/:param1', {
        templateUrl: 'http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/Partials/messages.htm',
        controller: 'MessagesController',
        resolve: checkToken
    });

    $routeProvider.when('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/profile/:param1', {
        templateUrl: 'http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/Partials/profile.htm',
        controller: 'ProfileController',
        resolve: checkToken
    });

    $routeProvider.when('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/login/:param1', {
        templateUrl: 'http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/Partials/login.htm',
        controller: 'LoginController'
    });    
    
    $routeProvider.otherwise({
        redirectTo: 'http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/login'
    });
    
});

mrApp.run(function ($rootScope, $location) {

    console.log("*********************** RUNNING ***********************");
    
});

mrApp.controller('MainController', [
    'ApiFactory',
    '$rootScope',
    '$scope',
    '$location',
    '$filter',
    '$timeout',
    'ConversationsFactory',
    MainController
]);

mrApp.controller('LoginController', [
    'ApiFactory',
    '$rootScope',
    '$scope',
    '$location',
    '$window',
    '$routeParams',
    '$localStorage',
    'UsersFactory',
    LoginController
]);

mrApp.controller('ConversationsController', [
    'ApiFactory',
    '$scope',
    '$rootScope',
    '$location',
    '$routeParams',
    'UsersFactory',
    'ConversationsFactory',
    '$filter',
    '$timeout',
    ConversationsController
]);

mrApp.controller('MessagesController', [
    'ApiFactory',
    '$scope',
    '$location',
    '$routeParams',
    'UsersFactory',
    'ConversationsFactory',
    '$timeout',
    MessagesController
]);

mrApp.controller('ProfileController', [
    'ApiFactory',
    '$rootScope',
    '$scope',
    '$location',
    '$routeParams',
    '$timeout',
    'UsersFactory',
    ProfileController
]);

mrApp.controller('NewConversationController', [
    'ApiFactory',
    '$rootScope',
    '$scope',
    '$location',
    '$timeout',
    'UsersFactory',
    'ConversationsFactory',
    NewConversationController
]);




