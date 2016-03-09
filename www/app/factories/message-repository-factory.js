/**
 * Created by Magnus Svensson on 09/03/16.
 */

angular.module('message', [])
    .factory('messageRepository', ['$http','$window','$rootScope','$location','$q','$state', 'tokenService', function($http, win, $rootScope, $location, $q,$state,tokenService) {
//Junk mojs fix moj yarr
        factory.getDeviceServiceUrl = function () {
            return "https://bngw1w5u7e.execute-api.eu-west-1.amazonaws.com/production/";
        };

        factory.getReservationServiceUrl = function () {
            //return "http://localhost:8885/";
            return "https://reservations.mobileresponse.se/";
        };

        /**
         * Instancing our apiurl to the browsers
         * @type {*}
         */
        factory.currentApiUrl = factory.getApiUrl(window.location);
        factory.currentDeviceServiceUrl = factory.getDeviceServiceUrl(window.location);
        factory.currentReservationServiceUrl = factory.getReservationServiceUrl(window.location);
        return factory;

    }])
