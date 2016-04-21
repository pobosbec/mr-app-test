/**
 * Created by Magnus Svensson on 09/03/16.
 */

angular.module('message', ['ngCordova'])
    .factory('messageRepository', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', '$cordovaSQLite', 'communicationService', function ($http, win, $rootScope, $location, $q, $state, tokenService, $cordovaSQLite, communicationService) {
        var db;

        var factory = {};

        // Indicates if messages are added but event isn't fired yet
        var evtMessagesAdded = false;

        var addedMessages = [];

        // Indicates if conversations are added but event isn't fired yet
        var evtConversationsAdded = false;


        // Indicates if the database is configured
        var isConfigured = false;

        var dbType = null;

        var databaseConfiguration = {
            name: "bosbec-mr.db",
            location: 1,
            version: "1.0",
            displayName: "Bosbec-Mr",
            size: (5 * 1024 * 1024)
        };

        var sqliteQueries = {
            dropMessages: 'DROP TABLE IF EXISTS Messages',
            createMessages: 'CREATE TABLE IF NOT EXISTS Messages (MessageId text primary key, CreatedOn integer, ConversationId text, Author text, JSON text)',
            getMessagesByTime: 'SELECT MessageId, JSON FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getConversations: 'SELECT DISTINCT ConversationId FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getMessagesByConversation: 'SELECT MessageId, JSON FROM Messages WHERE ConversationId = ? ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            insertMessage: 'INSERT INTO Messages (MessageId, CreatedOn, ConversationId, Author, JSON) VALUES (?, ?, ?, ?, ?)',
            doesMessageExist: 'SELECT COUNT(*) AS cnt FROM Messages WHERE MessageId=?',
            doMessagesExist: 'SELECT MessageId FROM Messages WHERE MessageId IN ',
            dropConversationPartisipantsTable: 'DROP TABLE IF EXISTS ConversationParticipants',
            createConversationParticipants: 'CREATE TABLE IF NOT EXISTS ConversationParticipants (ConversationId text primary key, Participants text)',
            getConversationParticipants: 'SELECT Participants FROM ConversationParticipants WHERE ConversationId = ?',
            insertConversationParticipants: 'INSERT OR REPLACE INTO ConversationParticipants (ConversationId, Participants) VALUES (?, ?)'
        };

        var webSqlQueries = {
            dropMessages: 'DROP TABLE IF EXISTS Messages',
            createMessages: 'CREATE TABLE IF NOT EXISTS Messages (MessageId unique, CreatedOn, ConversationId, Author, JSON)',
            getMessagesByTime: 'SELECT MessageId, JSON FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getConversations: 'SELECT DISTINCT ConversationId FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getMessagesByConversation: 'SELECT MessageId, JSON FROM Messages WHERE ConversationId = ? ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            insertMessage: 'INSERT INTO Messages (MessageId, CreatedOn, ConversationId, Author, JSON) VALUES (?, ?, ?, ?, ?)',
            doesMessageExist: 'SELECT COUNT(*) AS cnt FROM Messages WHERE MessageId=?',
            doMessagesExist: 'SELECT MessageId FROM Messages WHERE MessageId IN ',
            dropConversationPartisipantsTable: 'DROP TABLE IF EXISTS ConversationParticipants',
            createConversationParticipants: 'CREATE TABLE IF NOT EXISTS ConversationParticipants (ConversationId unique, Participants)',
            getConversationParticipants: 'SELECT Participants FROM ConversationParticipants WHERE ConversationId = ?',
            insertConversationParticipants: 'INSERT OR REPLACE INTO ConversationParticipants (ConversationId, Participants) VALUES (?, ?)'
        };

        var queries = null;

        factory.messages = [];

        /**
         * Initializes the factory.
         */
        factory.init = function () {
            //console.log('Factory.init() was called in message repository.');
            configureDatabase();
        };

        /**
         * Configures the database, sets up the db object and creates tables if needed.
         */
        function configureDatabase() {
            if (isConfigured) {
                return;
            }

            //console.log('Going to configure the database');
            isConfigured = true;

            var conf = databaseConfiguration;
            if (false && window.isPhoneGap) {
                // Mobile Device
                db = window.sqlitePlugin.openDatabase({ name: conf.name, location: conf.location });
                queries = sqliteQueries;
                dbType = 'sqlite';
                console.log('Opened up sqlite connection');
            } else {
                // Browser
                db = window.openDatabase(conf.name, conf.version, conf.displayName, conf.size);
                queries = webSqlQueries;
                dbType = 'webSQL';
                console.log('Opened up web SQL connection');
            }

            createMessagesTable()
                .then(
                    function () {
                        console.log('The messages table was successfully created.');
                    }, function (error) {
                        console.error('Failed to create the table.\r\n' + error.message);
                    });
            createConversationParticipantsTable().then(
                    function () {
                        console.log('The conversation participants table was successfully created.');
                    }, function (error) {
                        console.error('Failed to create the table.\r\n' + error.message);
                    });
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
         * Creates a promise for creating the database tables.
         */
        function createMessagesTable() {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.createMessages, [], function () {
                        resolve();
                    }, function (transaction, error) {
                        reject(error);
                    });
                });
            });
        }

        /**
         * Creates a promise for creating the database tables.
         */
        function createConversationParticipantsTable() {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.createConversationParticipants, [], function () {
                        resolve();
                    }, function (transaction, error) {
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

            if (dbType === 'webSQL') {
                for (i = 0; i < result.rows.length; i++) {
                    rows.push(result.rows[i]);
                }
            }
            else {
                for (i = 0; i < result.rows.length; i++) {
                    rows.push(result.rows.item(i));
                }
            }
            return rows;
        }

        /**
         * Creates a promise for dropping the database tables.
         */
        function dropMessagesTable() {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.dropMessages, [], function () {
                        resolve();
                    }, function (transaction, error) {
                        reject(error);
                    });
                });
            });
        }

        function dropConversationPartisipantsTable() {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.dropConversationPartisipantsTable, [], function () {
                        resolve();
                    }, function (transaction, error) {
                        reject(error);
                    });
                });
            });
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
                                    messages.push(JSON.parse(row['JSON']));
                                }
                                catch (err) {
                                    if (typeof row === "undefined") {
                                        console.error('Failed to parse message, row is undefined' + err);
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
                    var newMessages = [];
                    for (var i = 0; i < items.length; i++) {
                        var msg = items[i];
                        var newMessage = {};
                        newMessage.messageId = msg.MessageId;
                        newMessage.participantId = msg.ParticipantId;
                        newMessage.conversationId = msg.ConversationId;
                        newMessage.authorDisplayName = msg.AuthorDisplayName;
                        newMessage.author = msg.AuthorId;
                        newMessage.createdOn = msg.CreatedOn;
                        newMessage.content = msg.Content;
                        newMessage.isRead = msg.IsRead;
                        newMessages.push(newMessage);
                    }

                    conversation.Messages = newMessages;
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

                        addMessagesToConversation(conversation, itemsPerConversation).then(function (res) {
                            addParticipantsToConversation(res).then(function () {
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

            function findInLocalDatabase() {
                return $q(function (resolve, reject) {
                    db.transaction(function (tx) {
                        tx.executeSql(queries.getMessagesByConversation, [conversationId, size, offset],
                            function (trans, result) {
                                var messages = [];
                                var rows = getRows(result);

                                for (var i = 0; i < rows.length; i++) {
                                    var row = rows[i];
                                    try {
                                        if (typeof row !== "undefined" && row.hasOwnProperty("JSON")) {
                                            messages.push(JSON.parse(row.JSON));
                                        }
                                    }
                                    catch (err) {
                                        if (typeof row === "undefined") {
                                            console.error('Failed to parse message, row is undefined' + err);
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
            }

            var d = $q.defer();

            var messages = findInLocalDatabase();

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
                            ids.push(row['ConversationId']);
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
                                if (rows[0].hasOwnProperty("Participants")) {
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
                                    if (a.hasOwnProperty('MessageId')) {
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

        factory.addConversations = function (conversations) {
            return $q(function (resolve, reject) {
                if (conversations.length === 0) {
                    resolve();
                    return;
                }

                var timer = new Date();
                var errorMsg;

                var queryIn = [];
                for (var i = 0; i < conversations.length; i++) {
                    queryIn.push('\'' + conversations[i].ConversationId + '\'');
                }

                //console.log('queryIn took ' + (new Date() - timer) + 'ms to create!');

                timer = new Date();

                db.transaction(function (tx) {
                    //console.log('Transaction took ' + (new Date() - timer) + 'ms to open!');

                    //console.log('Checking if any of the ' + conversations.length + ' exist');

                    timer = new Date();
                    var inserted = 0;
                    for (var j = 0; j < conversations.length; j++) {
                        var conv = conversations[j];

                        insertConversation(conv).then(function () {
                            inserted++;
                            if (inserted === conversations.length) {
                                //console.log('All conversations are added in ' + (new Date() - timer) + 'ms!');
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
                        console.log("Received new messages: " + data.length);
                        factory.addMessages(data);
                    }
                    break;
                case 'new-conversations':
                    if (data != null) {
                        //console.log("Received new conversations: " + data.length);
                        factory.addConversations(data);
                    }
                    break;
                case 'device-ready':
                    break;
                case 'logged-out':
                    localStorage.removeItem('latestWhatIsNewUpdate');
                    // Clearing Table on logout, just to be srure
                    dropMessagesTable().then(function () {
                        return dropConversationPartisipantsTable();
                    }).then(
                        function () {
                            console.log('Dropped databases');
                        },
                        function (error) {
                            console.error('Failed to drop database.\r\n' + error.message);
                        });
                    break;
                case 'logged-in':
                    createMessagesTable().then(function () {
                        return createConversationParticipantsTable();
                    }).then(
                        function () {
                            console.log('Created databases after login');
                        },
                        function (error) {
                            console.error('Failed to create databases after login.\r\n' + error.message);
                        });
                    break;
                default:
                    break;
            }
        };

        factory.init();
        return factory;
    }]);
