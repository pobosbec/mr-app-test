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
    'services'
]).run(function () {
    FastClick.attach(document.body);

    //var databaseConfiguration = {
    //    name: "bosbec-mr.db",
    //    location: 1,
    //    version: "1.0",
    //    displayName: "Bosbec-Mr",
    //    size: (5 * 1024 * 1024)
    //};
});