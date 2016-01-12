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
        $location.path('/login');
        deferred.reject();
    }

    return deferred.promise;
} ];

mrApp.config(function ($routeProvider) {
    
    $routeProvider.when('/login', {
        templateUrl: 'Partials/login.htm',
        controller: 'LoginController'
    });

    $routeProvider.when('/main', {
        templateUrl: 'Partials/main.htm',
        controller: 'MainController',
        resolve: checkToken
    });
   
    $routeProvider.when('/conversations/:param1', {
        templateUrl: 'Partials/conversations.htm',
        controller: 'ConversationsController',
        resolve: checkToken
    });

    $routeProvider.when('/newconversation', {
        templateUrl: 'Partials/newConversation.htm',
        controller: 'NewConversationController',
        resolve: checkToken
    });
    
    $routeProvider.when('/messages/:param1', {
        templateUrl: 'Partials/messages.htm',
        controller: 'MessagesController',
        resolve: checkToken
    });

    $routeProvider.when('/profile/:param1', {
        templateUrl: 'Partials/profile.htm',
        controller: 'ProfileController',
        resolve: checkToken
    });

    $routeProvider.when('/login/:param1', {
        templateUrl: 'Partials/login.htm',
        controller: 'LoginController'
    });    
    
    $routeProvider.otherwise({
        redirectTo: '/login'
    });
    
});

mrApp.run(function ($rootScope, $location) {

    console.log("*********** RUN ***********************");
    
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




