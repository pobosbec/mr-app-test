/**
 * Created by Magnus Svensson on 09/03/16.
 */

angular.module('message', ['ngCordova'])
    .factory('messageRepository', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', '$cordovaSQLite', 'communicationService', 'databaseService', function ($http, win, $rootScope, $location, $q, $state, tokenService, $cordovaSQLite, communicationService, databaseService) {
        var db;

        var factory = {};

        // Indicates if messages are added but event isn't fired yet
        var evtMessagesAdded = false;

        // Indicates if conversations are added but event isn't fired yet
        var evtConversationsAdded = false;

        var queries = {
            dropMessages: 'DROP TABLE IF EXISTS Messages',
            createMessages: 'CREATE TABLE IF NOT EXISTS Messages (MessageId unique, CreatedOn, ConversationId, Author, JSON)',
            getMessagesByTime: 'SELECT MessageId, JSON FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getConversations: 'SELECT DISTINCT ConversationId FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getMessagesByConversation: 'SELECT MessageId, JSON FROM Messages WHERE ConversationId = ? ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            insertMessage: 'INSERT INTO Messages (MessageId, CreatedOn, ConversationId, Author, JSON) VALUES (?, ?, ?, ?, ?)',
            deleteConversation: 'DELETE FROM Messages WHERE ConversationId=?',
            doesMessageExist: 'SELECT COUNT(*) AS cnt FROM Messages WHERE MessageId=?',
            doMessagesExist: 'SELECT MessageId FROM Messages WHERE MessageId IN ',
            dropConversationPartisipantsTable: 'DROP TABLE IF EXISTS ConversationParticipants',
            createConversationParticipants: 'CREATE TABLE IF NOT EXISTS ConversationParticipants (ConversationId unique, Participants)',
            getConversationParticipants: 'SELECT Participants FROM ConversationParticipants WHERE ConversationId = ?',
            getAllConversationsAndParticipants: 'SELECT * FROM ConversationParticipants',
            insertConversationParticipants: 'INSERT OR REPLACE INTO ConversationParticipants (ConversationId, Participants) VALUES (?, ?)'
        };

        /**
         * Inserts the message to the database
         * @param message to insert
         * @returns {promise} returns a promise
         */
        function insertMessage(message) {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(
                        queries.insertMessage,
                        [
                            message.MessageId,
                            //moment(message.CreatedOn).unix(),
                            message.CreatedOn,
                            message.ConversationId,
                            message.Author,
                            JSON.stringify(message)],
                        function (trans, result) {
                            if (result.rowsAffected !== 1) {
                                var errorMessage;
                                if (message.hasOwnProperty("MessageId")) {
                                    errorMessage = 'The message with id \'' + message.MessageId + '\' doesn\'t seem to be added properly';
                                } else {
                                    errorMessage = 'The message has an undefined id';
                                }
                                reject(new {
                                    message: errorMessage
                                });
                                return;
                            }

                            resolve();
                        },
                        function (t, error) {
                            reject(error);
                        });
                });
            });
        }

        /**
         * Inserts the converation to the database
         * @param conversation to insert
         * @returns {promise} returns a promise
         */
        function insertConversation(conversation) {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(
                        queries.insertConversationParticipants,
                        [
                            conversation.ConversationId,
                            JSON.stringify(conversation.Participants)],
                        function (trans, result) {
                            if (result.rowsAffected !== 1) {
                                var errorMessage;
                                if (conversation.hasOwnProperty("ConversationId")) {
                                    errorMessage = 'The conversation with id \'' + conversation.ConversationId + '\' doesn\'t seem to be added properly';
                                } else {
                                    errorMessage = 'The conversation has an undefined id';
                                }
                                reject(new {
                                    message: errorMessage
                                });
                                return;
                            }

                            resolve();
                        },
                        function (t, error) {
                            reject(error);
                        });
                });
            });
        }

        function deleteConversation(conversationId) {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(
                        queries.deleteConversation,
                        [conversationId],
                        function (trans, result) {
                            resolve();
                        },
                        function (t, error) {
                            reject(error);
                        });
                });
            });
        }

        /**
         * Gets the rows from a sql query result and returns them as an array
         * @param {object} result - The result from a sql query
         */
        function getRows(result) {
            var rows = [], i = 0;

            for (i = 0; i < result.rows.length; i++) {
                rows.push(result.rows.item(i));
            }

            return rows;
        }

        factory.init = function () {
            db = databaseService.db;
        }

        factory.reMapMessage = function (message) {
            var reMapped = {};
            reMapped.messageId = message.MessageId;
            reMapped.participantId = message.ParticipantId;
            reMapped.conversationId = message.ConversationId;
            reMapped.authorDisplayName = message.AuthorDisplayName;
            reMapped.author = message.AuthorId;
            reMapped.createdOn = message.CreatedOn;
            reMapped.content = message.Content;
            reMapped.isRead = message.IsRead;
            return reMapped;
        }

        /**
         * Creates a promise for fetching messages descending with page index (0 and upwards) and a limit.
         * @param {number} pageIndex - The page index to fetch.
         * @param {number} size - The number of items per page.
         */
        factory.getMessagesByTime = function (pageIndex, size) {
            if (typeof (pageIndex) !== 'number') {
                pageIndex = 0;
            }

            if (typeof (size) !== 'number') {
                size = 20;
            }

            var offset = pageIndex * size;

            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.getMessagesByTime, [size, offset],
                        function (trans, result) {
                            var messages = [];
                            var rows = getRows(result);

                            for (var i = 0; i < rows.length; i++) {
                                var row = rows[i];
                                try {
                                    if (row !== null && typeof row !== "undefined" && row.hasOwnProperty("JSON")) {
                                        messages.push(JSON.parse(row['JSON']));
                                    }
                                }
                                catch (err) {
                                    if (row === null || typeof row === "undefined") {
                                        console.error('Failed to parse message, row is undefined. ' + err);
                                    } else {
                                        console.error('Failed to parse message \'' + row['MessageId'] + '\'.\r\n' + err);
                                    }
                                }
                            }

                            resolve(messages);
                        }, function (trans, error) {
                            console.error('Error while fetching messages from database.\r\n' + error.message);
                            reject(error);
                        });
                });
            });
        };

        /**
         * Creates a promise for getting latest conversations and maximum 5 messages for each conversation descending with page index (0 and upwards) and a limit.
         * @param {number} itemsPerConversation - The maximum number of items per conversation.
         * @param {number} pageIndex - The page index to fetch.
         * @param {number} size - The number of conversations per page.
         */
        factory.getConversationsByTime = function (itemsPerConversation, pageIndex, size) {
            itemsPerConversation = typeof (itemsPerConversation) !== 'number' ? 0 : itemsPerConversation;
            pageIndex = typeof (pageIndex) !== 'number' ? 0 : pageIndex;
            size = typeof (size) !== 'number' ? 5 : size;

            /// Adds the messages within the promise to a conversation
            var addMessagesToConversation = function (conversation, itmsPerConv) {

                return factory.getMessagesByConversation(conversation.Id, 0, itmsPerConv).then(function (items) {
                    conversation.Messages = items;
                    return conversation;
                });
            }

            /// Adds the participants within the promise to a conversation
            var addParticipantsToConversation = function (conversation) {
                return factory.getConversationParticipants(conversation.Id).then(function (items) {
                    conversation.Participants = items;
                });
            }

            return $q(function (resolve, reject) {
                var promise = factory.getConversations(pageIndex, size);

                promise.then(function (conversations) {
                    var numberOfConversations = conversations.length;
                    var handledConversations = 0;
                    var result = [];
                    for (var i = 0; i < conversations.length; i++) {
                        var cid = conversations[i];
                        var conversation = {
                            Id: cid,
                            Messages: []
                        }
                        result.push(conversation);

                        addMessagesToConversation(conversation, itemsPerConversation)
                            .then(function (res) {
                                addParticipantsToConversation(res)
                                    .then(function () {
                                        res.ConversationId = res.Id;
                                        handledConversations++;

                                        if (handledConversations === numberOfConversations) {
                                            resolve(result);
                                        }
                                    });
                            });
                    }
                    if (!conversations.length) {
                        resolve(result);
                    }
                }, function (error) {
                    reject(error);
                });
            });
        };

        factory.quickSync = function () {
            var promise = $q(function (resolve, reject) {
                var quickSyncConversationsSize = 10;
                var quickSyncMessagesSize = 10;
                console.log("QUICK SYNC");
                var conversationsFromApiPromise = communicationService.getAllConversations(null);
                conversationsFromApiPromise.then(
                    function (conversationsPromiseSuccess) {
                        var conversations = [];

                        for (var convo in conversationsPromiseSuccess.data.usersInConversations) {
                            var conversation = {
                                ConversationId: convo,
                                Messages: [],
                                Participants: conversationsPromiseSuccess.data.usersInConversations[convo]
                            };
                            conversations.push(conversation);
                        }
                        var processedConvos = 0;
                        conversations.some(function (conversation) {
                            if (typeof conversation === "undefined" || conversation === null) {
                                return;
                            }
                            processedConvos++;

                            // Break after fetching the desired ammount of conversations.
                            if (processedConvos <= quickSyncConversationsSize) {
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

                                    var messagesFromDatabasePromise = factory.getMessagesFromLocalDatabase(messagesFromApi[0].conversationId, 10, 0);
                                    messagesFromDatabasePromise.then(function (messagesFromDatabase) {
                                        var intersect = messagesFromDatabase.some(function (messageFromDb) {
                                            return messagesFromApi.some(function (messageFromApi) {
                                                return messageFromDb.MessageId === messageFromApi.messageId;
                                            });
                                        });
                                        //intersect = Math.random() < .5;
                                        if (!intersect) {
                                            if (typeof messagesFromApi[0] !== "undefined" && messagesFromApi[0] !== null && messagesFromApi[0].hasOwnProperty("conversationId")) {
                                                console.log("- CLEARED CONVO (" + messagesFromApi[0].conversationId + ") IN DB BECAUSE OF TOO MANY MISSING MESSAGES -");
                                                deleteConversation(messagesFromApi[0].conversationId);
                                            }
                                        }
                                        communicationService.messagesDownloaded(messagesFromApi);
                                        //console.log(intersect);
                                    });
                                });
                            }
                        });
                        resolve();
                    });

            });
            return promise;
        }

        factory.getMessagesFromLocalDatabase = function (conversationId, size, offset) {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.getMessagesByConversation, [conversationId, size, offset],
                        function (trans, result) {
                            var messages = [];
                            var rows = getRows(result);

                            for (var i = 0; i < rows.length; i++) {
                                var row = rows[i];
                                try {
                                    if (row !== null && typeof row !== "undefined" && row.hasOwnProperty("JSON")) {
                                        messages.push(JSON.parse(row.JSON));
                                    }
                                }
                                catch (err) {
                                    if (row === null || typeof row === "undefined") {
                                        console.error('Failed to parse message, row is undefined. ' + err);
                                    } else {
                                        console.error('Failed to parse message \'' + row.MessageId + '\'.\r\n' + err);
                                    }
                                }
                            }

                            resolve(messages);
                        }, function (trans, error) {
                            console.error('Error while fetching messages from database.\r\n' + error.message);
                            reject(error);
                        });
                });
            });
        };

        /**
         * Creates a promise for fetching messages in a conversation descending with page index (0 and upwards) and a limit.
         * @param {string} conversationId - The conversation id to fetch.
         * @param {number} pageIndex - The page index to fetch.
         * @param {number} size - The number of items per page.
         */
        factory.getMessagesByConversation = function (conversationId, pageIndex, size) {
            if (typeof (conversationId) !== 'string') {
                return $q(function (resolve, reject) { reject('Invalid conversation id'); });
            }

            pageIndex = typeof (pageIndex) !== 'number' ? 0 : pageIndex;
            size = typeof (size) !== 'number' ? 20 : size;
            var offset = pageIndex * size;

            var d = $q.defer();

            var messages = factory.getMessagesFromLocalDatabase(conversationId, size, offset);

            messages
                .then(function (success) {
                    if (success.length > 0) {
                        return d.resolve(success);
                    } else {
                        return communicationService.downloadMessagesForConversation(conversationId, false, (pageIndex + 1), size);
                    }
                })
                .then(function (fromWebApi) {

                    if (fromWebApi === undefined) {
                        return;
                    }

                    var newMessages = [];

                    if (fromWebApi.data.items.length === 0) {
                        return;
                    }

                    for (var i = 0; i < fromWebApi.data.items.length; i++) {
                        var msg = fromWebApi.data.items[i];

                        var newMessage = {};
                        newMessage.MessageId = msg.messageId;
                        newMessage.ParticipantId = msg.participantId;
                        newMessage.ConversationId = msg.conversationId;
                        newMessage.AuthorDisplayName = msg.authorDisplayName;
                        newMessage.Author = msg.authorId;
                        newMessage.CreatedOn = msg.createdOn;
                        newMessage.Content = msg.content;
                        newMessage.IsRead = msg.isRead;
                        newMessage.MetaData = msg.metaData;
                        newMessages.push(newMessage);
                        insertMessage(newMessage);
                    }
                    d.resolve(newMessages);
                });

            return d.promise;
        };

        /**
         * Creates a promise for fetching conversations descending with page index (0 and upwards) and a limit.
         * @param {number} pageIndex - The page index to fetch.
         * @param {number} size - The number of items per page.
         */
        factory.getConversations = function (pageIndex, size) {
            pageIndex = typeof (pageIndex) !== 'number' ? 0 : pageIndex;
            size = typeof (size) !== 'number' ? 20 : size;
            var offset = pageIndex * size;

            var deferred = $q.defer();
            db.transaction(function (tx) {
                tx.executeSql(queries.getConversations, [size, offset],
                    function (trans, result) {
                        var ids = [];
                        var rows = getRows(result);

                        for (var i = 0; i < rows.length; i++) {
                            var row = rows[i];
                            if (row !== null && typeof row != "undefined" && row.hasOwnProperty('ConversationId')) {
                                ids.push(row.ConversationId);
                            }
                        }

                        deferred.resolve(ids);
                    }, function (trans, error) {
                        console.error('Error while fetching messages from database.\r\n' + error.message);
                        deferred.reject(error);
                    });
            });
            return deferred.promise;

        };

        /**
          * Creates a promise for returning a list of participants in a conversation
          * @param {string} conversationId - the id of the conversation
          */
        factory.getConversationParticipants = function (conversationId) {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.getConversationParticipants, [conversationId],
                        function (trans, result) {
                            var rows = getRows(result);
                            var participants = "";
                            if (rows.length) {
                                if (rows[0] !== null && typeof rows[0] !== "undefined" && rows[0].hasOwnProperty("Participants")) {
                                    participants = JSON.parse(rows[0].Participants);
                                }
                            }

                            resolve(participants);
                        }, function (trans, error) {
                            console.error('Error while fetching Participants from database.\r\n' + error.message);
                            reject(error);
                        });
                });
            });
        };

        factory.getAllConversationsAndParticipants = function () {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.getAllConversationsAndParticipants, [],
                        function (trans, result) {
                            var rows = getRows(result);
                            var participants = "";
                            if (rows.length) {
                                if (rows[0] !== null && typeof rows[0] !== "undefined" && rows[0].hasOwnProperty("Participants")) {
                                    participants = JSON.parse(rows[0].Participants);
                                }
                            } else if (rows.length < 1) {
                                var promise = communicationService.getAllConversations(null);

                                promise.then(function (success) {
                                    factory.addConversations(success.data.items);
                                    resolve(success.data.items);
                                }, function (error) {
                                    console.error('Error while inserting ConversationParticipants from database.\r\n' + error.message);
                                });
                            }

                        }, function (trans, error) {
                            console.error('Error while fetching AllConversationsAndParticipants from database.\r\n' + error.message);
                            reject(error);
                        });
                });
            });
        };

        /**
         * Creates a promise for adding a message to the database
         * @param {object} message - the message to add
         */
        factory.addMessage = function (message) {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    var error;
                    //console.log('Checking if message message with id \'' + message.MessageId + '\' exists.');
                    tx.executeSql(queries.doesMessageExist, [message.MessageId], function (transaction, resultData) {
                        var rows = getRows(resultData);
                        if (rows.length !== 1) {
                            error = 'Unexpected number of rows returned (' + rows.length + '). Check sql statement!';
                            console.error(error);
                            reject(error);
                            return;
                        }

                        if (rows[0]['cnt'] !== 0) {
                            // console.log('Message width id \'' + message.MessageId + '\' exists, won\'t insert.');
                            return;
                        }

                        insertMessage(message)
                            .then(function () {
                                factory.messageAdded();
                                // console.log('Added message with id \'' + message.MessageId + '\'');
                                resolve();
                            }, function (error) {
                                if (message.hasOwnProperty("MessageId")) {
                                    error = 'Error while inserting message with id \'' + message.MessageId + '\'.\r\n' + error.message;
                                } else {
                                    error = 'Error while inserting message with undefined id.\r\n' + error.message;
                                }
                                console.error(error);
                                reject(error);
                            });
                    }, function (t, error) {
                        error = 'Error while checking if message exists.\r\n' + error.message;
                        console.error(error);
                        reject(error);
                    });
                });
            });
        };

        /**
         * Creates a promise that adds a number of messages to the database
         * @param {object|Array} messages - The messages to add
         */
        factory.addMessages = function (messages) {
            return $q(function (resolve, reject) {
                if (messages.length === 0) {
                    resolve();
                    return;
                }

                var timer = new Date();
                var errorMsg;

                var queryIn = [];
                for (var i = 0; i < messages.length; i++) {
                    queryIn.push('\'' + messages[i].MessageId + '\'');
                }

                //console.log('queryIn took ' + (new Date() - timer) + 'ms to create!');

                timer = new Date();

                db.transaction(function (tx) {
                    //console.log('Transaction took ' + (new Date() - timer) + 'ms to open!');

                    //console.log('Checking if any of the ' + messages.length + ' exist');
                    tx.executeSql(queries.doMessagesExist + '(' + queryIn.join(',') + ')', [],
                        function (transaction, resultData) {
                            var rows = getRows(resultData);

                            //console.log('Found ' + rows.length + ' messages already in db');

                            var inserted = 0;
                            var expected = 0;

                            timer = new Date();

                            for (var j = 0; j < messages.length; j++) {
                                var msg = messages[j];
                                if (rows.find(function (a) {
                                    if (a !== null && typeof a !== "undefined" && a.hasOwnProperty('MessageId') && msg !== null && typeof msg !== "undefined" && msg.hasOwnProperty('MessageId')) {
                                        return a.MessageId === msg.MessageId;
                                } else {
                                        return false;
                                }
                                })) {
                                    continue;
                                }

                                expected++;

                                insertMessage(msg).then(function () {

                                    inserted++;
                                    if (inserted === expected) {
                                        console.log('All messages are added in ' + (new Date() - timer) + 'ms!');
                                        factory.messageAdded();
                                        resolve();
                                    }
                                }, function (error) {
                                    errorMsg = 'Error while saving message.\r\n' + error.message;
                                    console.error(errorMsg);
                                    reject(errorMsg);
                                });
                            }
                        },
                        function (transaction, error) {
                            errorMsg = 'Error while checking if messages exist.\r\n' + error.message;
                            console.error(errorMsg);
                            reject(errorMsg);
                        });
                });
            });
        };

        factory.deleteConversation = function (conversationId) {
            deleteConversation(conversationId);
        }

        factory.addConversations = function (conversations) {
            return $q(function (resolve, reject) {
                if (conversations.length === 0) {
                    resolve();
                    return;
                }

                var errorMsg;

                var queryIn = [];
                for (var i = 0; i < conversations.length; i++) {
                    queryIn.push('\'' + conversations[i].ConversationId + '\'');
                }

                db.transaction(function (tx) {
                    var inserted = 0;
                    for (var j = 0; j < conversations.length; j++) {
                        var conv = conversations[j];

                        insertConversation(conv).then(function () {
                            inserted++;
                            if (inserted === conversations.length) {
                                factory.conversationsAdded();
                                resolve();
                            }
                        }, function (error) {
                            errorMsg = 'Error while saving conversation.\r\n' + error.message;
                            console.error(errorMsg);
                            reject(errorMsg);
                        });
                    }
                });
            });
        };

        factory.messageAdded = function () {

            if (evtMessagesAdded) {
                return;
            }

            evtMessagesAdded = true;

            setTimeout(function () {
                $rootScope.$broadcast('messages-added', {});
                evtMessagesAdded = false;
            },
                200);
        };

        factory.conversationsAdded = function () {
            if (evtConversationsAdded) {
                return;
            }

            evtConversationsAdded = true;

            setTimeout(function () {
                //console.log("conversations-added event");
                $rootScope.$broadcast('conversations-added', {});
                evtConversationsAdded = false;
            },
                200);
        };

        factory.messageUpdated = function (data) {
            $rootScope.$broadcast('message-updated', data);
        };

        factory.messagesChanged = function (data) {
            $rootScope.$broadcast('messages-changed', data);
        };

        factory.on = function (event, data) {
            switch (event.name) {
                case 'updated-message':
                    break;
                case 'new-messages':
                    if (data != null) {
                        //console.log("Received new messages: " + data.length);
                        factory.addMessages(data);
                    }
                    break;
                case 'new-conversations':
                    if (data != null) {
                        factory.addConversations(data);
                    }
                    break;
                case 'device-ready':
                    break;
                case 'logged-in':
                    factory.init();
                    break;
                default:
                    break;
            }
        };

        return factory;
    }]);
