/**
 * Created by Kristofer on 2016-03-13.
 */
angular.module('services', [])
    .factory('dataService', [
        'contactsService', 'messageRepository', 'communicationService', 'tokenService', '$q', function (contactsService, messageRepository, communicationService, tokenService, $q) {
            var factory = {};

            factory.conversations = [];
            factory.userId = tokenService.getAppUserId();
            factory.pageSize = 10;
            factory.AppUsers = contactsService.appUsers;

            // TODO: Temp variables, should not be used in future implementations
            factory.unProccessedConversations = [];

            function handleConversation(databasePromise) {
                for (var cid in databasePromise) {
                    var conversation = databasePromise[cid];
                    contactsService.usersExists(conversation.Participants);
                    factory.conversations.push(conversation);
                }
            }

            /**
             * Sets first quickload data (10*10 messages) 
             */
            function quickLoad() {
                var promise = $q(function (resolve, reject) {
                    var quickLoadConversationsSize = 10;
                    var quickLoadMessagesSize = 10;
                    console.log("QUICK LOADING");
                    var conversationsFromApiPromise = communicationService.getAllConversations(null);
                    conversationsFromApiPromise.then(
                        function (conversationsPromiseSuccess) {
                            var conversations = [];

                            for (var convo in conversationsPromiseSuccess.data.usersInConversations) {
                                // Check if conversation is already present in factory.conversations.
                                if (factory.conversations.filter(function (e) { return e.ConversationId == convo; }).length > 0) {
                                    continue;
                                }

                                var conversation = {
                                    ConversationId: convo,
                                    Messages: [],
                                    Participants: conversationsPromiseSuccess.data.usersInConversations[convo]
                                };

                                contactsService.usersExists(conversation.Participants);
                                conversations.push(conversation);
                            }

                            addConversations(conversations, quickLoadConversationsSize, quickLoadMessagesSize);
                            resolve();
                        });

                });
                return promise;
            }

            function addConversations(conversations, conversationsLimit, conversationMessages) {
                if (typeof conversationsLimit != "number") {
                    conversationsLimit = 1000;
                }
                if (typeof conversationMessages != "number") {
                    conversationMessages = 10;
                }

                var processedConvos = 0;

                conversations.some(function (conversation) {
                    if (typeof conversation === "undefined" || conversation === null) {
                        return;
                    }
                    processedConvos++;

                    // Break after fetching the desired ammount of conversations.
                    if (processedConvos <= conversationsLimit) {
                        syncConversationMessages(conversation, conversationMessages);
                        factory.conversations.push(conversation);
                    } else {
                        factory.unProccessedConversations.push(conversation);
                        //factory.moreConversationsAreAvailable = factory.unProccessedConversations.length > 0;
                    }
                });

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
                            conversation.Messages.push(messages[i]);
                        }
                    });
                }
            }

            function removeDuplicates(conversationId, messages) {

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
                                factory.conversations[i].Messages.push(message);
                                break;
                            }
                        }
                    }
                }

                messages.some(function (message) {
                    check(message);
                });
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

                var promise = messageRepository.getMessagesByConversation(
                        conversationId,
                        pageIndex,
                        pageSize);

                promise.then(
                    function (success) {
                        removeDuplicates(conversationId, success);
                        factory.isLoading = false;
                    },
                    function (error) {
                        //factory.pageIndex--;
                        factory.isLoading = false;
                        console.log('Could not get older messages for conversation.');
                    });
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
                        for (var cid in conversationsPromiseSuccess) {
                            var conversation = conversationsPromiseSuccess[cid];
                            contactsService.usersExists(conversation.Participants);
                            factory.conversations.push(conversation);
                        }
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
                        break;
                    case 'logged-in':
                        factory.quickLoad();
                        break;
                    case 'messages-added':
                        var messagesPromise = messageRepository.getMessagesByTime(0, 50);

                        messagesPromise.then(
                            function (gotMessages) {
                                gotMessages.some(function (message) {
                                    var arr = [];
                                    arr.push(message);
                                    removeDuplicates(message.ConversationId, arr);
                                });
                            },
                            function (errorGettingMessages) {
                                console.warn('Could not get messages.');
                            });
                        break;
                    default:
                        break;
                }
            };

            return factory;
        }
    ]);
