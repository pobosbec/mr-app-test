/**
 * Created by Kristofer on 2016-03-13.
 */
angular.module('communication', [])
    .factory('communicationService', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', 'messageRepository', function ($http, win, $rootScope, $location, $q, $state, tokenService, messageRepository) {

        var factory = {};
        var latestUpdate;
        var synchronizing = false;
        var inboxId = '8a0958a2-a163-4a20-8afa-e7315012e2d8';
        var pageSize = 50;

        var downloadMessages = function(periodStart, periodEnd, pageIndex, pageSize) {
            var req = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: tokenService.currentAppApiUrl + 'app/users/list-messages',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        PeriodStart: periodStart,
                        PeriodEnd: periodEnd,
                        PageIndex: pageIndex,
                        PageSize: pageSize
                    },
                    AuthenticationToken: tokenService.getAppAuthToken()
                }
            };

            return tokenService.httpPost(req);
        };

        factory.getAllConversations = function() {

            var conv = [];
            var req = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: tokenService.currentAppApiUrl + 'app/conversations/get-users-in-conversation',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        ConversationIds: null
                    },
                    AuthenticationToken: tokenService.getAppAuthToken()
                }
            };

            return tokenService.httpPost(req);
        }

        factory.messagesDownloaded = function (data){

            var newMessages = [];

            if(data.length === 0){
                return;
            }

            for(var i = 0; i < data.length; i++){
                var msg = data[i];

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
                    console.log('This event is deprecated!');
                    break;
                case 'download-messages':
                    factory.syncPeriodMessages(args.PeriodStart, args.PeriodEnd, args.Index, args.Size);
                    break;
                case 'push-notification':
                    console.log("communication-factory received broadcast: push-notification");
                    if (args != undefined) {
                        console.log('Event received: ' + JSON.stringify(args));
                    }
                    factory.downloadWhatIsNew(args);
                    break;
                default:
                    break;
            }
        }

        factory.syncOnce = function(periodStart, periodEnd, currentIndex, size){
            var promise = downloadMessages(periodStart, periodEnd, currentIndex, size);

            promise.then(
                function(success){
                    if(success.data.count > 0){
                        factory.messagesDownloaded(success.data.items);
                    }
                    else {
                        console.log('Sync between' + periodStart + ' and ' + periodEnd + ' is complete.')
                    }
                },
                function(error){
                    console.log('Error when making request to list-messages.')
                });
        }

        factory.syncPeriodMessages = function downloadWhatsNew(periodStart, periodEnd, currentIndex, size) {
            var promise = downloadMessages(periodStart, periodEnd, currentIndex, size);

            promise.then(
                function(success){
                    if(success.data.pageIndex < success.data.maxPages){
                        // more pages to get
                        factory.messagesDownloaded(success.data.items);
                        currentIndex++;
                        factory.syncPeriodMessages(periodStart, periodEnd, currentIndex, size);
                    }
                    else if(success.data.pageIndex === success.data.maxPages){
                        factory.messagesDownloaded(success.data.items);
                        console.log('Sync between' + periodStart + ' and ' + periodEnd + ' is complete.')
                    }
                    else if(success.data.pageIndex > success.data.maxPages){
                        console.error('Tried to list messages with pageIndex higher than maxPages.')
                    }
                },
                function(error){
                    console.log('Error when making request to list-messages.')
                });
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

            // TODO: return promise instead?

            $http(req
            ).then(function successCallback(response) {
                console.log('Message sent.')
            }, function errorCallback(response) {
                console.log('Message could not be sent.');
            });
        }

        return factory;
    }])