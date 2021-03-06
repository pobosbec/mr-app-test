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

]).run(function (contactsService, messageRepository, dataService, databaseService, $rootScope, logService, tokenService) {
    databaseService.init().then(function () {
        contactsService.init();
        messageRepository.init();
        logService.init();

        if (tokenService.getLoginCredentials() !== null && tokenService.getLoginCredentials() !== undefined){
            //$rootScope.$broadcast('services-started');
            //dataService.isLoggedIn = true;
            //dataService.quickLoad();
            //dataService.resolveUnidentifiedAppUsers();
            $rootScope.$broadcast('services-started');
            dataService.quickLoad();
        }
        else {
            $rootScope.logout();
        }

        //hotfix
        // dataService.isLoggedIn = true;
        //  dataService.isLoggedIn = true;
        // dataService.quickLoad();
        // dataService.resolveUnidentifiedAppUsers();

    }, function () {
        console.error('Could not initiate database service.');
    });
});
