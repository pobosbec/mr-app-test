/**
 * Created by robinpipirs on 11/12/15.
 */
var mobileresponseWebbApp = angular.module('administratorApp', [
    'ngCordova',
    'snap',
    'ngAnimate',
    'ngResource',
    'ui.router',
    'ui.bootstrap',
    'angularMoment',
    'token',
    'messages',
    'ngMessages',
    'event',
    'login',
    'communication',
    'message',
    'contacts',
    'contact',
    'conversations',
    'modalcontroll',
    'profile',
    'settings',
    'services',
    'ngSanitize',
    'database',
    'logging',
    'debug'
]).run(function (contactsService, messageRepository, dataService, databaseService, $rootScope, logService) {
    if (window.isPhoneGap) {
        var fastClick = require('fastclick');
        fastClick.attach(document.body);
    }


    databaseService.init().then(function () {
        contactsService.init();
        messageRepository.init();
        logService.init();
        $rootScope.$broadcast('services-started');
    }, function () {
        console.error('Could not initiate database service.');
    });
});