/**
 * Created by Magnus Svensson on 09/03/16.
 */

angular.module('message', ['ngCordova'])
    .factory('messageRepository', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', '$cordovaSQLite', function ($http, win, $rootScope, $location, $q, $state, tokenService, $cordovaSQLite, angularMoment) {
        var db;

        var factory = {};

        // Indicates if messages are added but event isn't fired yet
        var evtMessagesAdded = false;

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
            doMessagesExist: 'SELECT MessageId FROM Messages WHERE MessageId IN '
        };

        var webSqlQueries = {
            dropMessages: 'DROP TABLE IF EXISTS Messages',
            createMessages: 'CREATE TABLE IF NOT EXISTS Messages (MessageId unique, CreatedOn, ConversationId, Author, JSON)',
            getMessagesByTime: 'SELECT MessageId, JSON FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getConversations: 'SELECT DISTINCT ConversationId FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getMessagesByConversation: 'SELECT MessageId, JSON FROM Messages WHERE ConversationId = ? ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            insertMessage: 'INSERT INTO Messages (MessageId, CreatedOn, ConversationId, Author, JSON) VALUES (?, ?, ?, ?, ?)',
            doesMessageExist: 'SELECT COUNT(*) AS cnt FROM Messages WHERE MessageId=?',
            doMessagesExist: 'SELECT MessageId FROM Messages WHERE MessageId IN '
        };

        var queries = null;

        factory.messages = [];

        /**
         * Initializes the factory.
         */
        factory.init = function () {
            console.log('Factory.init() was called in message repository.');
            configureDatabase();
        };

        /**
         * Configures the database, sets up the db object and creates tables if needed.
         */
        function configureDatabase() {
            if (isConfigured) {
                return;
            }

            console.log('Going to configure the database');
            isConfigured = true;

            var conf = databaseConfiguration;
            if (window.isPhoneGap) {
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

            createDatabase()
                .then(
                    function () {
                        console.log('The database is successfully created.');
                    }, function (error) {
                        console.error('Failed to create the database.\r\n' + error.message);
                    });
        }

        /**
         * Creates a promise for creating the database tables.
         */
        function createDatabase() {
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
        function dropDatabase() {
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
                                    console.error('Failed to parse message \'' + row['MessageId'] + '\'.\r\n' + err);
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
            var addMessagesToConversation = function(conversation, itmsPerConv) {
                getMessagesByConversation(conversation.Id, 0, itmsPerConv).then(function (items) {
                    conversation.messages = items;
                });
            }

            return $q(function (resolve, reject) {
                var promise = getConversations(pageIndex, size);

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

                        addMessagesToConversation(conversation, itemsPerConversation).then(function () {
                            handledConversations++;

                            if (handledConversations === numberOfConversations) {
                                resolve(result);
                            }
                        });
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

            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.getMessagesByConversation, [conversationId, size, offset],
                        function (trans, result) {
                            var messages = [];
                            var rows = getRows(result);

                            for (var i = 0; i < rows.length; i++) {
                                var row = rows[i];
                                try {
                                    messages.push(JSON.parse(row['JSON']));
                                }
                                catch (err) {
                                    console.error('Failed to parse message \'' + row['MessageId'] + '\'.\r\n' + err);
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
        factory.getMessagesForConversation = function (conversationId, pageIndex, size) {
            if (typeof (conversationId) !== 'string') {
                return $q(function (resolve, reject) { reject('Invalid conversation id'); });
            }

            pageIndex = typeof (pageIndex) !== 'number' ? 0 : pageIndex;
            size = typeof (size) !== 'number' ? 20 : size;

            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.getMessagesByConversation, [conversationId, size, pageIndex],
                        function (trans, result) {
                            var messages = [];
                            var rows = getRows(result);

                            for (var i = 0; i < rows.length; i++) {
                                var row = rows[i];
                                try {
                                    messages.push(JSON.parse(row['JSON']));
                                }
                                catch (err) {
                                    console.error('Failed to parse message \'' + row['MessageId'] + '\'.\r\n' + err);
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
         * Creates a promise for fetching conversations descending with page index (0 and upwards) and a limit.
         * @param {number} pageIndex - The page index to fetch.
         * @param {number} size - The number of items per page.
         */
        factory.getConversations = function (pageIndex, size) {
            pageIndex = typeof (pageIndex) !== 'number' ? 0 : pageIndex;
            size = typeof (size) !== 'number' ? 20 : size;
            var offset = pageIndex * size;

            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.getConversations, [size, offset],
                        function (trans, result) {
                            var ids = [];
                            var rows = getRows(result);

                            for (var i = 0; i < rows.length; i++) {
                                var row = rows[i];
                                ids.push(row['ConversationId']);
                            }

                            resolve(ids);
                        }, function (trans, error) {
                            console.error('Error while fetching messages from database.\r\n' + error.message);
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
                    console.log('Checking if message message with id \'' + message.MessageId + '\' exists.');
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
                                error = 'Error while inserting message with id \'' + message.MessageId + '\'.\r\n' + error.message;
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

                console.log('queryIn took ' + (new Date() - timer) + 'ms to create!');

                timer = new Date();

                db.transaction(function (tx) {
                    console.log('Transaction took ' + (new Date() - timer) + 'ms to open!');

                    console.log('Checking if any of the ' + messages.length + ' exist');
                    tx.executeSql(queries.doMessagesExist + '(' + queryIn.join(',') + ')', [],
                        function (transaction, resultData) {
                            var rows = getRows(resultData);

                            console.log('Found ' + rows.length + ' messages already in db');

                            var inserted = 0;
                            var expected = 0;

                            timer = new Date();

                            for (var j = 0; j < messages.length; j++) {
                                var msg = messages[j];
                                if (rows.find(function (a) {
                                        return a['MessageId'] === msg.MessageId;
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
                                console.error('');
                                reject(new {
                                    message: 'The message width id \'' + message.MessageId + '\' doesn\'t seem to be added properly'
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
                console.log("messages-added event");
                $rootScope.$broadcast('messages-added', {});
                evtMessagesAdded = false;
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
                case 'device-ready':
                    break;
                case 'logged-out':
                    localStorage.removeItem('latestWhatIsNewUpdate');
                    // Clearing Table on logout, just to be sure
                    dropDatabase().then(
                        function () {
                            console.log('Dropped database');
                        },
                        function (error) {
                            console.error('Failed to drop database.\r\n' + error.message);
                        });
                    break;
                case 'logged-in':
                    createDatabase().then(
                        function () {
                            console.log('Created database after login');
                        },
                        function (error) {
                            console.error('Failed to create database after login.\r\n' + error.message);
                        });
                    break;
                default:
                    break;
            }
        };

        factory.init();
        return factory;
    }]);
