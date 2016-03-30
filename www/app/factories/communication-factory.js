/**
 * Created by Kristofer on 2016-03-13.
 */
angular.module('communication', [])
    .factory('communicationService', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', 'messageRepository', function ($http, win, $rootScope, $location, $q, $state, tokenService, messageRepository) {

        var factory = {};
        var latestUpdate;
        var synchronizing = false;
        var inboxId = '8a0958a2-a163-4a20-8afa-e7315012e2d8';

        factory.init = function(){
            latestUpdate = factory.getLatestUpdate();
        };

        factory.getLatestUpdate = function() {
            var latest = null;
            if (typeof (Storage) !== "undefined") {
                latest = localStorage.getItem('latestWhatIsNewUpdate');
            }

            if (latest == null) {
                var today = new Date();
                today.setDate(today.getDate() - 700); // MAGNUS; Used to be 7
                latest = today.toJSON();
            }
            return latest;
        };

        factory.synchronize = function (appAuthToken) {
            var latest = factory.getLatestUpdate();
            console.log('Making request to what-is-new. Last update: ' + latest);

            var req = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: tokenService.currentAppApiUrl + 'app/conversations/what-is-new',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        LastUpdate: latest,
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
                console.log('Success response from what-is-new. Setting last update to: ' + data.data.lastUpdate);

                //if(data.data.lastUpdate == null) {
                //    console.log('Could not find lastUpdate in what-is-new response.');
                //    return;
                //}

                latestUpdate = data.data.lastUpdate;

                updateLastUpdated();

                factory.messagesDownloaded(data);

            }, function errorCallback(response) {
                synchronizing = false;
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }

        factory.messagesDownloaded = function (data){

            var newMessages = [];

            if(data.data.messages.length === 0){
                return;
            }
            
            for(var i = 0; i < data.data.messages.length; i++){
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
                    console.log("communication-factory received broadcast: download-whats-new");
                    if (args != undefined) {
                        console.log('Event received: ' + JSON.stringify(args));
                    }
                    factory.downloadWhatIsNew(args);
                    break;
                case 'push-notification':
                    console.log("communication-factory received broadcast: push-notification");
                    if (args != undefined) {
                        console.log('Event received: ' + JSON.stringify(args));
                    }
                    factory.downloadWhatIsNew(args);
                    break;
                case 'logged-in':
                    factory.init();
                    break;
                default:
                    break;
            }
        }

        factory.downloadWhatIsNew = function downloadWhatsNew() {
            if (!synchronizing) {
                var appAuthToken = tokenService.getAppAuthToken();
                if (appAuthToken === null || appAuthToken === 'undefined' || appAuthToken === undefined) {
                    console.log('AppToken was null');
                    return;
                }
                factory.synchronize(tokenService.getAppAuthToken());
            }
        }

        factory.sendMessage = function sendMessage(message, users, metadata){
            var req = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: tokenService.currentAppApiUrl + 'app/conversations/create-message',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        InstanceName: "mobileresponse",
                        InboxId: inboxId,
                        Participants: users,
                        Message: message
                        //MetaData: metadata
                    },
                    AuthenticationToken: tokenService.getAppAuthToken()
                }
            };

            $http(req
            ).then(function successCallback(response) {
                alert('Message sent!');
            }, function errorCallback(response) {
                alert('Could not send message.');
            });
        }

        function updateLastUpdated(){
            if (typeof (Storage) !== "undefined") {
                //var latestMessage = messageRepository.getNewestMessage();
                //if (typeof latestMessage !== 'undefined' && latestMessage !== null && latestMessage.hasOwnProperty("CreatedOn")) {
                //    latestUpdate = latestMessage.CreatedOn;
                //} else {
                //    latestUpdate = factory.getLatestUpdate();
                //}
                //console.warn(latestUpdate);
                localStorage.setItem('latestWhatIsNewUpdate', latestUpdate);
            } else {
                alert("ach nein! keiner storage!!!1");
                alert("This is actually not a good thing.. We would like you (yes YOU) to contact us and tell us at Bosbec what platform you are running on.");
                return;
            }
        };

        factory.init();

        return factory;
    }])