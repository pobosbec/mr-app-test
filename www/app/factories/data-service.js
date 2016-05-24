/**
 * Created by Kristofer on 2016-05-16.
 */
angular.module('services', [])
    .factory('dataService', [
        'contactsService', 'messageRepository', 'communicationService', 'tokenService', '$q', 'logService', function (contactsService, messageRepository, communicationService, tokenService, $q, logService) {
            var factory = {};

            factory.conversations = [];
            factory.userId = null;
            factory.pageSize = 10;
            factory.appUsers = contactsService.appUsers;
            factory.moreConversationsAreAvailable = true;
            factory.unProccessedConversations = [];
            factory.unidentifiedAppUsers = [];
            factory.quickLoading = false;

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
                                logService.error('Could not sync user: ' + JSON.stringify(error));
                            });
                    }
                });
            }

            factory.onFocusOrResume = function () {

                var maxConversationsToCheck = 10;

                if (factory.conversations.length < 10) {
                    maxConversationsToCheck = factory.conversations.length;
                }

                for (var i = 0; i < maxConversationsToCheck; i++) {
                    var conversation = factory.conversations[i];

                    var messagesPromise = communicationService.downloadMessagesForConversation(conversation.ConversationId, false, 0, 10, false);
                    messagesPromise.then(function (result) {
                        var messagesFromApi = result.data.items.sort(function (a, b) {
                            if (a.CreatedOn > b.CreatedOn) {
                                return 1;
                            }
                            if (a.CreatedOn < b.CreatedOn) {
                                return -1;
                            }
                            return 0;
                        });

                        var messagesFromDatabasePromise = messageRepository.getMessagesFromLocalDatabase(messagesFromApi[0].conversationId, 10, 0);

                        messagesFromDatabasePromise.then(function (messagesFromDatabase) {

                            var intersect = true;

                            if (messagesFromDatabase.length === messagesFromApi.length) {
                                for (var j = 0; j < messagesFromApi.length; j++) {
                                    var apiMessage = messagesFromApi[j];
                                    var dbMessage = messagesFromDatabase[j];

                                    if (apiMessage.messageId !== dbMessage.MessageId) {
                                        intersect = false;
                                    }
                                }
                            } else {
                                intersect = false;
                            }

                            //var intersect = messagesFromDatabase.some(function (messageFromDb) {
                            //    return messagesFromApi.some(function (messageFromApi) {
                            //        return messageFromDb.MessageId === messageFromApi.messageId;
                            //    });
                            //});

                            if (!intersect) {
                                if (typeof messagesFromApi[0] !== "undefined" && messagesFromApi[0] !== null && messagesFromApi[0].hasOwnProperty("conversationId")) {
                                    logService.log("- CLEARED CONVO (" + messagesFromApi[0].conversationId + ") IN DB BECAUSE OF TOO MANY MISSING MESSAGES -");
                                    messageRepository.deleteConversation(messagesFromApi[0].conversationId);
                                    communicationService.messagesDownloaded(messagesFromApi);
                                }
                            }
                        });
                    });
                }
            }

            /**
             * Sets first quickload data (10*10 messages) 
             */
            function quickLoad() {
                var promise = $q(function (resolve, reject) {
                    var conversationsFromApiPromise = communicationService.getAllConversations(null);
                    conversationsFromApiPromise.then(
                        function (conversationsPromiseSuccess) {

                            var quickSyncConversationsSize = 10;
                            var quickSyncMessagesSize = 10;

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

                            var processedConvos = 0;

                            var appUserExistsPromises = [];

                            conversations.some(function (conversation) {
                                if (typeof conversation === "undefined" || conversation === null) {
                                    return;
                                }

                                processedConvos++;

                                if (processedConvos <= quickSyncConversationsSize) {
                                    // Gets 10 latest messages for conversation
                                    var messagesPromise = communicationService.downloadMessagesForConversation(conversation.ConversationId, false, 0, quickSyncMessagesSize, false);
                                    messagesPromise.then(function (result) {
                                        var messagesFromApi = result.data.items.sort(function (a, b) {
                                            if (a.CreatedOn > b.CreatedOn) {
                                                return 1;
                                            }
                                            if (a.CreatedOn < b.CreatedOn) {
                                                return -1;
                                            }
                                            return 0;
                                        });

                                        var messagesFromDatabasePromise = messageRepository.getMessagesFromLocalDatabase(messagesFromApi[0].conversationId, quickSyncMessagesSize, 0);

                                        messagesFromDatabasePromise.then(function (messagesFromDatabase) {
                                            var intersect = messagesFromDatabase.some(function (messageFromDb) {
                                                return messagesFromApi.some(function (messageFromApi) {
                                                    return messageFromDb.MessageId === messageFromApi.messageId;
                                                });
                                            });
                                            if (!intersect) {
                                                if (typeof messagesFromApi[0] !== "undefined" && messagesFromApi[0] !== null && messagesFromApi[0].hasOwnProperty("conversationId")) {
                                                    logService.log("- CLEARED CONVO (" + messagesFromApi[0].conversationId + ") IN DB BECAUSE OF TOO MANY MISSING MESSAGES -");
                                                    messageRepository.deleteConversation(messagesFromApi[0].conversationId);
                                                    communicationService.messagesDownloaded(messagesFromApi);
                                                }
                                            } else {
                                                conversation.Messages = messagesFromDatabase;
                                            }
                                        });
                                    });

                                    conversation.Participants.some(function (participant) {
                                        if (participant !== factory.userId)
                                            appUserExistsPromises.push(contactsService.userExists(participant));
                                    });

                                    factory.conversations.push(conversation);
                                } else {
                                    factory.unProccessedConversations.push(conversation);
                                }
                            });

                            resolveUnidentifiedAppUsers(appUserExistsPromises);

                            messageRepository.addConversations(conversations).then(function (success) {
                                resolve();
                            });
                        });

                });
                return promise;
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
                            processMessages(message.ConversationId, arr, false);
                        });
                    });
                }

                if (typeof conversationsLimit != "number") {
                    conversationsLimit = 1000;
                }
                if (typeof conversationMessages != "number") {
                    conversationMessages = 10;
                }

                var appUserExistsPromises = [];

                for (var j = 0; j < conversations.length; j++) {
                    conversations[j].Participants.some(function (participant) {
                        if (participant !== factory.userId)
                            appUserExistsPromises.push(contactsService.userExists(participant));
                    });
                }

                resolveUnidentifiedAppUsers(appUserExistsPromises);

                var processedConvos = 0;

                conversations.some(function (conversation) {
                    if (typeof conversation === "undefined" || conversation === null) {
                        return;
                    }
                    processedConvos++;

                    if (processedConvos <= conversationsLimit) {


                        syncConversationMessages(conversation, conversationMessages);
                        factory.conversations.push(conversation);
                    } else {
                        factory.unProccessedConversations.push(conversation);
                        factory.moreConversationsAreAvailable = factory.unProccessedConversations.length > 0;
                    }
                });
            }

            function processMessages(conversationId, messages, newMessages) {

                function checkIfMessagesShouldBeAdded(messages) {
                    messages.some(function (message) {

                        function shouldAdd(message) {

                            for (var i = 0; i < factory.conversations.length; i++) {
                                if (factory.conversations[i].ConversationId === message.ConversationId) {

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
                                    }
                                    break;
                                }
                            }
                        }

                        shouldAdd(message);
                    });
                }

                var newConversation = true;

                if (factory.conversations.filter(function (e) { return e.ConversationId === conversationId; }).length > 0) {
                    newConversation = false;
                }

                if (newConversation) {

                    var appUserExistsPromises = [];

                    var conversationsFromApiPromise = communicationService.getAllConversations([conversationId]);
                    conversationsFromApiPromise.then(
                        function (conversationsPromiseSuccess) {

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

                                conversation.Participants.some(function (participant) {
                                    if (participant !== factory.userId)
                                        appUserExistsPromises.push(contactsService.userExists(participant));
                                });

                                factory.conversations.unshift(conversation);
                            }

                            resolveUnidentifiedAppUsers(appUserExistsPromises);
                            checkIfMessagesShouldBeAdded(messages);
                        });
                } else {
                    checkIfMessagesShouldBeAdded(messages);
                }
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

            factory.loadMessages = function (conversationId, pageIndex, pageSize) {
                //TODO: defer to be able to show loading icon?

                var deferred = $q.defer();

                var promise = messageRepository.getMessagesByConversation(
                        conversationId,
                        pageIndex,
                        pageSize);

                promise.then(
                    function (success) {
                        processMessages(conversationId, success, false);
                        factory.isLoading = false;
                        deferred.resolve();
                    },
                    function (error) {
                        logService.log(error);
                        deferred.reject();
                    });

                return deferred.promise;
            }

            factory.quickLoad = function () {

                factory.quickLoading = true;

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

                        messageRepository.getAllConversationsAndParticipants().then(function (success) {
                            success.some(function (conversation) {
                                var processed = false;

                                if (factory.conversations.some(function (convo) { return conversation.ConversationId === convo.ConversationId })) {
                                    processed = true;
                                }

                                if (!processed) {
                                    factory.unProccessedConversations.push(conversation);
                                }
                            });
                        });

                        resolveUnidentifiedAppUsers(appUserExistsPromises);
                    }, function (conversationsPromiseError) {
                        logService.warn(conversationsPromiseError);
                    }).then(function () {
                        var promise = $q(function (resolve, reject) {

                            //var quickLoadPromise = quickLoad();
                            //quickLoadPromise.then(function (result) {
                            //    resolve();
                            //});

                            if (!factory.conversations.length) {
                                var quickLoadPromise = quickLoad();
                                quickLoadPromise.then(function (result) {
                                    resolve();
                                });
                            } else {
                                factory.onFocusOrResume();
                                resolve();
                            }
                        });

                        var error = new Error();

                        promise.then(function () {
                            factory.quickLoading = false;
                            logService.log({
                                text: "Initial loading of conversations done.",
                                metadata: { stacktrace: error.stack }
                            });
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
                        factory.conversations.length = 0;
                        factory.unProccessedConversations.length = 0;
                        factory.unidentifiedAppUsers.length = 0;
                        factory.userId = tokenService.getAppUserId();
                        factory.quickLoad();
                        break;
                    case 'messages-added':
                        var messagesPromise = messageRepository.getMessagesByTime(0, 50);

                        messagesPromise.then(
                            function (gotMessages) {

                                function onlyUnique(value, index, self) {
                                    return self.indexOf(value) === index;
                                }

                                var conversationIds = [];

                                gotMessages.some(function (message) {
                                    conversationIds.push(message.ConversationId);
                                });

                                conversationIds = conversationIds.filter(onlyUnique);

                                conversationIds.some(function (conversationId) {
                                    var messages = gotMessages.filter(function (obj) {
                                        if (obj.ConversationId === conversationId) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    });

                                    processMessages(conversationId, messages, true);
                                });
                            },
                            function (errorGettingMessages) {
                                logService.warn('Could not get messages.');
                            });
                        break;
                    case 'services-started':
                        factory.quickLoad();
                    case 'load':
                        break;
                    default:
                        break;
                }
            };

            return factory;
        }
    ]);
