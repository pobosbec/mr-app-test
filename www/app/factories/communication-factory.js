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
                ignoreLoadingBar: true,
                url: tokenService.currentAppApiUrl + 'app/conversations/what-is-new',
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

        factory.messagesDownloaded = function (data){

            var newMessages = [];

            for(i = 0; i < data.data.messages.length; i++){
                var msg = data.data.messages[i];

                var newMessage = {};
                newMessage.MessageId = msg.messageId;
                newMessage.ParticipantId = msg.participantId;
                newMessage.ConversationId = msg.conversationId;
                newMessage.AuthorDisplayName = msg.authorDisplayName;
                newMessage.Author = msg.authorId;
                newMessage.CreatedOn = msg.createdOn;
                newMessage.Content = msg.content;
                newMessages.push(newMessage);
            }

            $rootScope.$broadcast('new-messages', newMessages);
        }

        factory.on = function (event, args) {
            switch (event.name) {
                case 'download-whats-new':
                    //console.log("download-whats-new");
                    if (args != undefined) {
                        console.log(args);
                    }
                    downloadWhatsNew(args);
                    break;
                default:
                    break;
            }
        }


        function downloadWhatsNew(){
            var appAuthToken = tokenService.getAppAuthToken();
            if (appAuthToken === null || appAuthToken === 'undefined' || appAuthToken === undefined) {
                tokenService.isAppAuthenticated();
                console.log('AppToken was null');
                return;
            }
            factory.synchronize(tokenService.getAppAuthToken());
        }

        return factory;
    }])