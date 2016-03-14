/**
 * Created by Kristofer on 2016-03-13.
 */
angular.module('communication', [])
    .factory('communicationService', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', function ($http, win, $rootScope, $location, $q, $state, tokenService) {

        var factory = {};

        var lastUpdate = "2016-01-01T00:00:00Z";

        factory.synchronize = function (appAuthToken) {

            var req = {
                method: 'POST',
                url: tokenService.currentApiUrl + 'app/conversations/what-is-new',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        LastUpdate: lastUpdate,
                        DeviceId: "abc"
                    },
                    AuthenticationToken: appAuthToken
                }
            };

            $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                var data = response.data;

                lastUpdate = data.LastUpdate;

                factory.messagesDownloaded(data);

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }

        $rootScope.$on('download-whats-new', function(event, args) {
            var appAuthToken = tokenService.getAppAuthToken();
            if(appAuthToken === null || appAuthToken === 'undefined' || appAuthToken === undefined){
                tokenService.isAppAuthenticated(tokenService.getAuthToken());
                console.log('AppToken was null');
                return;
            }
                factory.synchronize(tokenService.getAppAuthToken());
        });

        factory.messagesDownloaded = function (data){

            var newMessages = [];

            for(i = 0; i < data.data.messages.length; i++){
                var msg = data.data.messages[i];

                var newMessage = {};
                newMessage.Author = msg.authorId;
                newMessage.CreatedOn = msg.createdOn;
                newMessage.Content = msg.content;
                newMessages.push(newMessage);
            }

            $rootScope.$broadcast('new-messages', newMessages);
        }

        return factory;
    }])