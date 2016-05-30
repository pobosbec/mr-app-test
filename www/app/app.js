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
        $rootScope.$broadcast('services-started');

        tokenService.isAuthenticated().then(function(success) {
            dataService.isLoggedIn = true;
            dataService.quickLoad();
            dataService.resolveUnidentifiedAppUsers();
        }, function(error) {
            //not authenticated

            //check if we have credentials
            var credentials = tokenService.getLoginCredentials();
            if (credentials !== undefined && credentials !== null) {
                logService(new LogObject("Credentials was not null or undefined"));
                logService(credentials);
                tokenService.authenticate(credentials.username, credentials.password).then(function(success){
                    logService(new LogObject("Success running authenticate"));
                    dataService.isLoggedIn = true;
                    dataService.quickLoad();
                    dataService.resolveUnidentifiedAppUsers();

                }, function(error){
                    logService(new LogObject("Error running authenticate"));
                });
            }
            else {
                logService(new LogObject("Credentials was null or undefined"));
                logService(credentials);
                tokenService.logout();
            }
        });
    }, function () {
        console.error('Could not initiate database service.');
    });
});