/**
 * Created by Kristofer on 2016-05-16.
 */
angular.module('services', [])
    .factory('dataService', [
        'contactsService', 'messageRepository', 'communicationService', 'tokenService', '$q', function (contactsService, messageRepository, communicationService, tokenService, $q) {
            var factory = {};

            factory.conversations = [];
            factory.userId = null;
            factory.pageSize = 10;
            factory.AppUsers = contactsService.appUsers;
            factory.moreConversationsAreAvailable = true;
            factory.unProccessedConversations = [];
            factory.unidentifiedAppUsers = [];

            /**
             * Sets first quickload data (10*10 messages) 
             */
            function quickLoad() {
                var promise = $q(function (resolve, reject) {
                    var quickLoadConversationsSize = 10;
                    var quickLoadMessagesSize = 10;

                    var conversationsFromApiPromise = communicationService.getAllConversations(null);
                    conversationsFromApiPromise.then(
                        function (conversationsPromiseSuccess) {

                            var conversations = [];

                            for (var convo in conversationsPromiseSuccess.data.usersInConversations) {
                                // Check if conversation is already present in factory.conversations.
                                if (factory.conversations.filter(function (e) { return e.ConversationId === convo; }).length > 0) {
                                    continue;
                                }

                                var conversation = {
                                    ConversationId: convo,
                                    Messages: [],
                                    Participants: conversationsPromiseSuccess.data.usersInConversations[convo]
                                };

                                conversations.push(conversation);
                            }

                            messageRepository.addConversations(conversations);

                            addConversations(conversations, quickLoadConversationsSize, quickLoadMessagesSize);
                            resolve();
                        });

                });
                return promise;
            }

            function resolveUnidentifiedAppUsers(appUserExistsPromises) {

                function syncAppUserParticipant(participantId) {
                    var query = '';

                    for (var i = 0; i < participantId.length; i++) {
                        if (i === 0) {
                            query = participantId[i];
                        } else {
                            query += ',' + participantId[i];
                        }
                    }

                    return contactsService.searchAppUser(query);
                }

                $q.all(appUserExistsPromises).then(function (values) {
                    for (var i = 0; i < values.length; i++) {
                        if (values[i].Found === false) {
                            factory.unidentifiedAppUsers.push(values[i].Id);
                        }
                    }

                    if (factory.unidentifiedAppUsers.length > 0) {
                        var promise = syncAppUserParticipant(factory.unidentifiedAppUsers);

                        promise.then(
                            function (success) {
                                if (success.data.items != null) {
                                    success.data.items.some(function (appUser) {
                                        factory.unidentifiedAppUsers.splice(factory.unidentifiedAppUsers.indexOf(appUser.id), 1);
                                        contactsService.addAppUser(appUser);
                                    });
                                }
                            },
                            function (error) {
                                console.error('Could not sync user: ' + JSON.stringify(error));
                            });
                    }
                });
            }

            function addConversations(conversations, conversationsLimit, conversationMessages) {

                function syncConversationMessages(conversation, amount) {
                    var messagesPromise = communicationService.downloadMessagesForConversation(conversation.ConversationId, false, 0, amount);
                    messagesPromise.then(function (result) {
                        var messages = result.data.items.sort(function (a, b) {
                            if (a.CreatedOn > b.CreatedOn) {
                                return 1;
                            }
                            if (a.CreatedOn < b.CreatedOn) {
                                return -1;
                            }
                            return 0;
                        });
                        // TODO: util class for this data formatting
                        for (var i = 0; i < messages.length; i++) {
                            messages[i].MessageId = messages[i].messageId;
                            messages[i].ParticipantId = messages[i].participantId;
                            messages[i].ConversationId = messages[i].conversationId;
                            messages[i].AuthorDisplayName = messages[i].authorDisplayName;
                            messages[i].Author = messages[i].authorId;
                            messages[i].CreatedOn = messages[i].createdOn;
                            messages[i].Content = messages[i].content;
                            messages[i].IsRead = messages[i].isRead;
                        }

                        messages.some(function (message) {
                            var arr = [];
                            arr.push(message);
                            removeDuplicates(message.ConversationId, arr, false);
                        });
                    });
                }

                if (typeof conversationsLimit != "number") {
                    conversationsLimit = 1000;
                }
                if (typeof conversationMessages != "number") {
                    conversationMessages = 10;
                }

                var processedConvos = 0;
                var appUserExistsPromises = [];

                conversations.some(function (conversation) {
                    if (typeof conversation === "undefined" || conversation === null) {
                        return;
                    }
                    processedConvos++;

                    if (processedConvos <= conversationsLimit) {
                        conversation.Participants.some(function (participant) {
                            if (participant !== factory.userId)
                                appUserExistsPromises.push(contactsService.userExists(participant));
                        });

                        syncConversationMessages(conversation, conversationMessages);
                        factory.conversations.push(conversation);
                    } else {
                        factory.unProccessedConversations.push(conversation);
                        factory.moreConversationsAreAvailable = factory.unProccessedConversations.length > 0;
                    }
                });

                resolveUnidentifiedAppUsers(appUserExistsPromises);
            }

            function removeDuplicates(conversationId, messages, newMessages) {

                function check(message) {
                    for (var i = 0; i < factory.conversations.length; i++) {
                        if (factory.conversations[i].ConversationId === conversationId) {

                            var shouldAdd = true;

                            for (var j = 0; j < factory.conversations[i].Messages.length; j++) {
                                var arrMessage = factory.conversations[i].Messages[j];
                                if (arrMessage.MessageId === message.MessageId) {
                                    shouldAdd = false;
                                }
                            }

                            if (shouldAdd) {
                                if (newMessages) {
                                    factory.conversations[i].Messages.unshift(message);
                                } else {
                                    factory.conversations[i].Messages.push(message);
                                }
                                break;
                            }
                        }
                    }
                }

                messages.some(function (message) {
                    check(message);
                });
            }

            factory.loadUnprocessedConversations = function () {
                var conversationToProcess = [];

                if (factory.unProccessedConversations.length < 10) {
                    for (var i = 0; i < factory.unProccessedConversations.length; i++) {
                        conversationToProcess.push(factory.unProccessedConversations.shift());
                    }
                } else {
                    for (var j = 0; j < 10; j++) {
                        conversationToProcess.push(factory.unProccessedConversations.shift());
                    }
                }
                factory.moreConversationsAreAvailable = factory.unProccessedConversations.length > 0;
                addConversations(conversationToProcess);
            }

            factory.loadConversations = function () {
                var pageIndex = Math.floor(factory.conversations.length / factory.pageSize);

                var conversationsFromDatabasePromise = messageRepository.getConversationsByTime(10, pageIndex, 10);

                conversationsFromDatabasePromise.then(
                    function (conversationsPromiseSuccess) {
                        handleConversation(conversationsPromiseSuccess);
                    }, function (conversationsPromiseError) {
                        console.warn(conversationsPromiseError);
                    });
            };

            factory.loadMessages = function (conversationId, pageIndex, pageSize) {
                //TODO: defer to be able to show loading icon?

                var deferred = $q.defer();

                var promise = messageRepository.getMessagesByConversation(
                        conversationId,
                        pageIndex,
                        pageSize);

                promise.then(
                    function (success) {
                        removeDuplicates(conversationId, success, false);
                        factory.isLoading = false;
                        deferred.resolve();
                    },
                    function (error) {
                        console.log(error);
                        deferred.reject();
                    });

                return deferred.promise;
            }

            factory.initializeConversations = function () {
                var promise = messageRepository.getAllConversationsAndParticipants();

                promise.then(function (success) {
                    factory.conversations.push(success);
                }, function (error) {
                    console.error(error);
                });
            };

            factory.quickLoad = function () {
                // Deliver what ever data we have asap:
                var conversationsFromDatabasePromise = messageRepository.getConversationsByTime(10, 0, 10);
                //Let's load the initial 10
                conversationsFromDatabasePromise.then(
                    function (conversationsPromiseSuccess) {
                        var appUserExistsPromises = [];

                        for (var cid in conversationsPromiseSuccess) {
                            var conversation = conversationsPromiseSuccess[cid];

                            if (conversation.Participants.constructor === Array) {
                                conversation.Participants.some(function (participant) {
                                    if (participant !== factory.userId)
                                        appUserExistsPromises.push(contactsService.userExists(participant));
                                });
                            }
                            
                            factory.conversations.push(conversation);
                        }

                        resolveUnidentifiedAppUsers(appUserExistsPromises);
                    }, function (conversationsPromiseError) {
                        console.warn(conversationsPromiseError);
                    }).then(function () {
                        var promise = $q(function (resolve, reject) {

                            if (!factory.conversations.length) {
                                var quickLoadPromise = quickLoad();
                                quickLoadPromise.then(function (result) {
                                    resolve();
                                });
                            } else {
                                resolve();
                            }
                        });

                        promise.then(function () {
                            factory.isLoading = false;
                            console.log("Initial loading of conversations done.");
                        });
                    });

            }

            factory.on = function (event, data) {
                switch (event.name) {
                    case 'logged-out':
                        factory.conversations.length = 0;
                        factory.unProccessedConversations.length = 0;
                        factory.unidentifiedAppUsers.length = 0;
                        break;
                    case 'logged-in':
                        factory.userId = tokenService.getAppUserId();
                        factory.quickLoad();
                        break;
                    case 'messages-added':
                        var messagesPromise = messageRepository.getMessagesByTime(0, 50);

                        messagesPromise.then(
                            function (gotMessages) {
                                gotMessages.some(function (message) {
                                    var arr = [];
                                    arr.push(message);
                                    removeDuplicates(message.ConversationId, arr, true);
                                });
                            },
                            function (errorGettingMessages) {
                                console.warn('Could not get messages.');
                            });
                        break;
                    case 'load':
                        //factory.quickLoad();
                        break;
                    case 'on-focus':
                        //factory.quickLoad();
                        break;
                    default:
                        break;
                }
            };

            return factory;
        }
    ]);
