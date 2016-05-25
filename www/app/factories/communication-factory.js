/**
 * Created by Kristofer on 2016-03-13.
 */
angular.module('communication', [])
    .factory('communicationService', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', 'contactsService', 'logService', function ($http, win, $rootScope, $location, $q, $state, tokenService, contactsService, logService) {
        var factory = {};
        var inboxId = '8a0958a2-a163-4a20-8afa-e7315012e2d8';

        var fetchMessagesInterval;
        if (!window.isPhoneGap) {
            fetchMessagesInterval = setInterval(function () {
                var oneMinuteAgo = new Date();
                oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
                factory.syncPeriodMessages(oneMinuteAgo.toJSON(), new Date().toJSON(), 0, 20);
            }, 5000);
        }

        var downloadMessages = function (periodStart, periodEnd, pageIndex, pageSize) {
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

        var downloadMessagesForConversationDuringPeriod = function (conversationId, sortAscending, periodStart, periodEnd, pageIndex, pageSize) {
            var req = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: tokenService.currentAppApiUrl + 'app/users/list-messages-for-conversation-for-time-period',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        ConversationId: conversationId,
                        SortAscending: sortAscending,
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

        var downloadMessagesForConversation = function (conversationId, sortAscending, pageIndex, pageSize) {
            var req = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: tokenService.currentAppApiUrl + 'app/conversations/list-messages',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        ConversationId: conversationId,
                        SortAscending: sortAscending,
                        PageIndex: pageIndex,
                        PageSize: pageSize
                    },
                    AuthenticationToken: tokenService.getAppAuthToken()
                }
            };

            return tokenService.httpPost(req);
        };

        var getAllConversations = function (conversationIds) {

            var req = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: tokenService.currentAppApiUrl + 'app/conversations/get-users-in-conversation',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        ConversationIds: conversationIds
                    },
                    AuthenticationToken: tokenService.getAppAuthToken()
                }
            };

            return tokenService.httpPost(req);
        }

        factory.appUsers = contactsService.AppUsers;

        factory.getAllConversations = function (conversationIds) {
            return getAllConversations(conversationIds);
        }

        factory.downloadMessagesForConversation = function (conversationId, sortAscending, pageIndex, pageSize, broadcastAfterFetch) {
            if (typeof broadcastAfterFetch !== "boolean") {
                broadcastAfterFetch = true;
            }

            var messages = downloadMessagesForConversation(conversationId, sortAscending, pageIndex, pageSize);
            messages.then(function (success) {
                if (broadcastAfterFetch) {
                    factory.messagesDownloaded(success.data.items);
                };
            });
            return messages;
        }

        factory.messagesDownloaded = function (data) {
            var newMessages = [];

            if (data.length === 0) {
                return;
            }

            for (var i = 0; i < data.length; i++) {
                var msg = data[i];
                
                var newMessage = {};
                newMessage.MessageId = msg.messageId;
                newMessage.ParticipantId = msg.participantId;
                newMessage.ConversationId = msg.conversationId;
                newMessage.AuthorDisplayName = contactsService.getUsername(msg.participantId);
                newMessage.Author = msg.authorId;
                newMessage.CreatedOn = msg.createdOn;
                newMessage.Content = msg.content;
                newMessage.IsRead = msg.isRead;
                newMessage.MetaData = msg.metaData;
                newMessages.push(newMessage);
            }

            $rootScope.$broadcast('new-messages', newMessages);
        }

        factory.conversationsDownloaded = function (data) {
            var newConversations = [];

            if (data.length === 0) {
                return;
            }

            for (conv in data) {
                var newConversation = {};
                newConversation.ConversationId = conv;
                newConversation.Participants = data[conv];
                newConversations.push(newConversation);
            }

            $rootScope.$broadcast('new-conversations', newConversations);
        }

        factory.on = function (event, args) {
            switch (event.name) {
                case 'download-messages':
                    factory.syncPeriodMessages(args.PeriodStart, args.PeriodEnd, args.PageIndex, args.PageSize);
                    break;
                case 'push-notification':
                    var fiveMinutesAgo = new Date();
                    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
                    factory.syncPeriodMessages(fiveMinutesAgo.toJSON(), new Date().toJSON(), 0, 50);
                    break;
                case 'logged-in':
                    if (!window.isPhoneGap) {
                        clearInterval(fetchMessagesInterval);
                        fetchMessagesInterval = setInterval(function () {
                            var oneMinuteAgo = new Date();
                            oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
                            factory.syncPeriodMessages(oneMinuteAgo.toJSON(), new Date().toJSON(), 0, 20);
                        }, 5000);
                    }
                    //var fiveMinutesAgo = new Date();
                    //fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
                    //factory.syncPeriodMessages(fiveMinutesAgo.toJSON(), new Date().toJSON(), 0, 50);
                    break;
                default:
                    break;
            }
        }

        factory.syncPeriodMessagesForConversation = function (conversationId, sortAscending, periodStart, periodEnd, pageIndex, pageSize) {
            var promise = downloadMessagesForConversationDuringPeriod(conversationId, sortAscending, periodStart, periodEnd, pageIndex, pageSize);

            promise.then(
                function (success) {
                    if (success.data && success.data.hasOwnProperty("pageIndex")) {
                        if (success.data.pageIndex < success.data.maxPages) {
                            // more pages to get
                            factory.messagesDownloaded(success.data.items);
                            currentIndex++;
                            factory.syncPeriodMessages(periodStart, periodEnd, currentIndex, size);
                        } else if (success.data.pageIndex === success.data.maxPages) {
                            factory.messagesDownloaded(success.data.items);
                        } else if (success.data.pageIndex > success.data.maxPages) {
                            logService.error(new LogObject('Tried to list messages with pageIndex higher than maxPages.'));
                        }
                    } else {
                        // Error....
                        logService.error(new LogObject(success));
                    }
                },
                function (error) {
                    logService.error('Error when making request to list-messages. Error: ' + JSON.stringify(error));
                });
        }

        factory.syncPeriodMessages = function downloadWhatsNew(periodStart, periodEnd, currentIndex, size) {
            var promise = downloadMessages(periodStart, periodEnd, currentIndex, size);

            promise.then(
                function (success) {
                    if (success.data && success.data.hasOwnProperty("pageIndex")) {
                        if (success.data.pageIndex < success.data.maxPages) {
                            // more pages to get
                            factory.messagesDownloaded(success.data.items);
                            currentIndex++;
                            factory.syncPeriodMessages(periodStart, periodEnd, currentIndex, size);
                        } else if (success.data.pageIndex === success.data.maxPages) {
                            factory.messagesDownloaded(success.data.items);
                        } else if (success.data.pageIndex > success.data.maxPages) {
                            logService.error('Tried to list messages with pageIndex higher than maxPages.');
                        }
                    } else {
                        // Error....
                        logService.error(success);
                    }
                },
                function (error) {
                    logService.error('Error when making request to list-messages. Error: ' + JSON.stringify(error));
                });
        }

        factory.sendMessage = function sendMessage(message, users, metadata) {
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
                logService.log('Message sent.');
            }, function errorCallback(response) {
                logService.log('Message could not be sent.');
            });
        }

        var fixAuthorForMessage = function (msg) {
            var promise = $q(function (resolve, reject) {
                if (msg.authorDisplayName !== "") {
                    resolve(msg);
                    return;
                }
                contactsService.getAppUser(msg.authorId).then(function (e) {
                    if (e.length && e[0].hasOwnProperty("displayName")) {
                        msg.authorDisplayName = e[0].displayName;
                    }
                    resolve(msg);
                });
            });
            return promise;
        }

        return factory;
    }])
