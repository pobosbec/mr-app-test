/**
 * Created by Magnus Svensson on 09/03/16.
 */

angular.module('message', ['ngCordova'])
    .factory('messageRepository', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', '$cordovaSQLite', function ($http, win, $rootScope, $location, $q, $state, tokenService, $cordovaSQLite, angularMoment) {
        var db;

        var factory = {};
        var evtMessagesAdded = false;

        var dabataseConfiguration = {
            name: "bosbec-mr.db",
            location: 1,
            version: "1.0",
            displayName: "Bosbec-Mr",
            size: (5 * 1024 * 1024)
        };

        var sqliteQueries = {
            dropTable: 'DROP TABLE IF EXISTS Messages',
            createTable: 'CREATE TABLE IF NOT EXISTS Messages (MessageId text primary key, CreatedOn integer, ConversationId text, Author text, JSON text)',
            getMessagesByTime : 'SELECT MessageId, JSON FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getConversations : 'SELECT DISTINCT ConversationId FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getMessagesByConversation : 'SELECT MessageId, JSON FROM Messages WHERE ConversationId = ? ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            /**/  getAllMessages: 'SELECT * FROM Messages ORDER BY CreatedOn DESC',
            /**/  getLatestMessages: 'SELECT * FROM Messages ORDER BY CreatedOn DESC LIMIT ?',
            /**/  getAllMessagesFromAuthor: 'SELECT * FROM Messages WHERE Author=?',
            /**/  getAllMessagesFromConversation: 'SELECT * FROM Messages WHERE ConversationId=?',
            insertMessage: 'INSERT INTO Messages (MessageId, CreatedOn, ConversationId, Author, JSON) VALUES (?, ?, ?, ?, ?)',
            doesMessageExist : 'SELECT COUNT(*) AS cnt FROM Messages WHERE MessageId=?'
        };

        var webSqlQueries = {
            dropTable: 'DROP TABLE IF EXISTS Messages',
            createTable: 'CREATE TABLE IF NOT EXISTS Messages (MessageId unique, CreatedOn, ConversationId, Author, JSON)',
            getMessagesByTime : 'SELECT MessageId, JSON FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            getConversations : 'SELECT DISTINCT ConversationId FROM Messages ORDER BY CreatedOn DESC LIMIT ? OFFSET ?',
            /**/  getAllMessages: 'SELECT * FROM Messages ORDER BY CreatedOn DESC',
            /**/  getLatestMessages: 'SELECT * FROM Messages ORDER BY CreatedOn DESC LIMIT ?',
            /**/  getAllMessagesFromAuthor: 'SELECT * FROM Messages WHERE Author=?',
            /**/  getAllMessagesFromConversation: 'SELECT * FROM Messages WHERE ConversationId=?',
            insertMessage: 'INSERT INTO Messages (MessageId, CreatedOn, ConversationId, Author, JSON) VALUES (?, ?, ?, ?, ?)',
            doesMessageExist : 'SELECT COUNT(*) AS cnt FROM Messages WHERE MessageId=?'
        };

        var queries = null;

        factory.messages = [];

        factory.init = function () {
            var conf = dabataseConfiguration;
            if (window.isPhoneGap) {
                // Mobile Device
                db = window.sqlitePlugin.openDatabase({ name: conf.name, location: conf.location });
                queries = sqliteQueries;

            } else {
                // Browser
                db = window.openDatabase(conf.name, conf.version, conf.displayName, conf.size);
                queries = webSqlQueries;
            }

            //// IF WE WANT TO DROP TABLE BEFORE CREATE:

            //console.log("Drop and create");
            //db.transaction(function (tx) {
            //    tx.executeSql(queries.dropTable, [], function () {
            //        db.transaction(function (tx) {
            //            tx.executeSql(queries.createTable, [], function (result, data) {
            //                $rootScope.$broadcast('download-whats-new');
            //            }, function (result) {
            //                console.error(result);
            //            });
            //        });
            //    });
            //});

            //// REGULAR CREATE TABLE WITH FETCH:

            console.log("Creating table");
            db.transaction(function (tx) {
                tx.executeSql(queries.createTable, [], function (transaction, result) {
                    console.log('Table \'Messages\' is created');

                    // Fetches messages in database
                    /*      tx.executeSql("SELECT * FROM Messages", [], function (result, resultData) {
                     for (var i = 0; i < resultData.rows.length; i++) {
                     var insertMessage = JSON.parse(resultData.rows[i].JSON);
                     insertMessage.Content = "[LÄST FRÅN DB] "+insertMessage.Content;
                     factory.messages.push(insertMessage);
                     }
                     factory.messageAdded(factory.messages);
                     }); */
                    $rootScope.$broadcast('download-whats-new');
                }, function (transaction, error) {
                    console.error('Failed to create table \'Messages\'.\r\n' + error.message);
                });
            });
        }

        factory.authors = [{
            Id: "956EF224-E73B-453A-97BA-DDEBFAA<A9D17",
            Avatar: "img/profile-pics/6.jpg",
            DisplayName: "Testa Testsson"
        },
            {
                Id: "37F57046-F1FD-4EEC-8E31-BB74246EB0AC",
                Avatar: "img/profile-pics/2.jpg",
                DisplayName: "Börje Tumme"
            },
            {
                Id: "48001363-EF6C-4FAC-B627-77AAAE361BD7",
                Avatar: "img/profile-pics/5.jpg",
                DisplayName: "Pannbandine Grön"
            }];
/*
        factory.getMessages = function (limit) {
            var messages = factory.messages;
            if (factory.messages != undefined) {
                for (var thisMessage in messages) {
                    if (messages.hasOwnProperty(thisMessage));
                    {
                        var author = factory.authors.filter(function (v) {
                            return v.Id === messages[thisMessage].Author;
                        })[0];

                        if (author != undefined) {
                            if (!messages[thisMessage].hasOwnProperty("AuthorAvatar") && author.hasOwnProperty("Avatar")) {
                                messages[thisMessage]["AuthorAvatar"] = author.Avatar;
                            }
                            if (!messages[thisMessage].hasOwnProperty("AuthorDisplayName") && author.hasOwnProperty("DisplayName")) {
                                messages[thisMessage]["AuthorDisplayName"] = author.DisplayName;
                            }
                        }
                    }
                }

                messages.sort(function (a, b) {
                    return new Date(b["CreatedOn"]) - new Date(a["CreatedOn"]);
                });
            }

            return messages;
        };
*/

        /**
         * Creates a promise for fetching messages descending with page index (0 and upwards) and a limit.
         * @param {number} pageIndex - The page index to fetch.
         * @param {number} size - The number of items per page.
         */
        factory.getMessagesByTime = function(pageIndex, size){
            if(typeof (pageIndex) !== 'number'){
                pageIndex = 0;
            }

            if(typeof (limit) !== 'number'){
                size = 20;
            }

            var offset = pageIndex * size;

            return $q(function(resolve, reject){
                db.transaction(function (tx) {
                    tx.executeSql(queries.getMessagesByTime, [size, offset],
                        function(trans, result){
                            var messages = [];
                            var rows = result.rows;

                            for(var i = 0; i < rows.length; i++){
                                var row = rows[i];
                                try{
                                    messages.push(JSON.parse(row['JSON']));
                                }
                                catch(err){
                                    console.error('Failed to parse message \'' + row['MessageId'] + '\'.\r\n' + err);
                                }
                            }

                            resolve(messages);
                        }, function(trans, error){
                            console.error('Error while fetching messages from database.\r\n' + error.message);
                            reject(error);
                        });
                });
            });
        };

        /**
         * Creates a promise for getting latest conversations and maximum 5 messages for each conversation descending with page index (0 and upwards) and a limit.
         * @param {string} conversationId - The conversation id to fetch.
         * @param {number} itemsPerConversation - The maximum number of items per conversation.
         * @param {number} pageIndex - The page index to fetch.
         * @param {number} size - The number of items per page.
         */
        factory.getConversationsByTime = function(conversationId, itemsPerConversation, pageIndex, size) {
            if(typeof (conversationId) !== 'string'){
                return $q(function(resolve, reject){ reject('Invalid conversation id');});
            }

            itemsPerConversation = typeof (itemsPerConversation) !== 'number' ? 0 : itemsPerConversation;
            pageIndex = typeof (pageIndex) !== 'number' ? 0 : pageIndex;
            size = typeof (size) !== 'number' ? 20 : size;

            return $q(function(resolve, reject){
                var promise = getConversations(pageIndex, size);

                promise.then(function(conversations){
                    var result = [];
                    for (var i = 0; i < conversations.length; i++){

                    }
                }, function(error){
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
        factory.getMessagesByConversation = function(conversationId, pageIndex, size) {
            if(typeof (conversationId) !== 'string'){
                return $q(function(resolve, reject){ reject('Invalid conversation id');});
            }

            // SELECT DISTINCT m.ConversationId FROM Messages as m INNER JOIN Messages as m2 ON m.MessageId = m2.MessageId ORDER BY m.CreatedOn DESC LIMIT 5

            pageIndex = typeof (pageIndex) !== 'number' ? 0 : pageIndex;
            size = typeof (size) !== 'number' ? 20 : size;
            var offset = pageIndex * size;

            return $q(function(resolve, reject){
                db.transaction(function (tx) {
                    tx.executeSql(queries.getMessagesByConversation, [conversationId, size, offset],
                        function(trans, result){
                            var messages = [];
                            var rows = result.rows;

                            for(var i = 0; i < rows.length; i++){
                                var row = rows[i];
                                try{
                                    messages.push(JSON.parse(row['JSON']));
                                }
                                catch(err){
                                    console.error('Failed to parse message \'' + row['MessageId'] + '\'.\r\n' + err);
                                }
                            }

                            resolve(messages);
                        }, function(trans, error){
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
        factory.getConversations = function(pageIndex, size) {
            pageIndex = typeof (pageIndex) !== 'number' ? 0 : pageIndex;
            size = typeof (size) !== 'number' ? 20 : size;
            var offset = pageIndex * size;

            return $q(function(resolve, reject){
                db.transaction(function (tx) {
                    tx.executeSql(queries.getConversations, [size, offset],
                        function(trans, result){
                            var ids = [];
                            var rows = result.rows;

                            for(var i = 0; i < rows.length; i++){
                                var row = rows[i];
                                ids.push(row['ConversationId']);
                            }

                            resolve(ids);
                        }, function(trans, error){
                            console.error('Error while fetching messages from database.\r\n' + error.message);
                            reject(error);
                        });
                });
            });
        };


        /*
        factory.getNewestMessage = function () {
            return factory.getMessages()[0];
        };

        factory.getOldestMessage = function () {
            return factory.getMessages().reverse()[0];
        };
*/

        factory.addMessage = function (data) {
            db.transaction(function (tx) {
                console.log('Checking if message message with id \'' + data.MessageId + '\' exists.');
                tx.executeSql(queries.doesMessageExist, [data.MessageId], function (transaction, resultData) {
                    var rows = resultData.rows;
                    if(rows.length !== 1){
                        console.error('Unexpected number of rows returned (' + rows.length + '). Check sql statement!');
                        return;
                    }

                    if(rows[0]['cnt'] !== 0){
                        console.log('Message width id \'' + data.MessageId + '\' exists, won\'t insert.');
                        return;
                    }

                    tx.executeSql(
                        queries.insertMessage,
                        [
                            data.MessageId,
                            moment(data.CreatedOn).unix(),
                            data.ConversationId,
                            data.Author,
                            JSON.stringify(data)],
                        function (trans, result) {
                            if(result.rowsAffected !== 1) {
                                console.error('The message width id \'' + data.MessageId + '\' doesn\'t seem to be added properly');
                                return;
                            }

                            console.log('Added message with id \'' + data.MessageId + '\'');
                            factory.messageAdded();
                        },
                        function(t, error){
                            console.error('Error while inserting message with id \'' + data.MessageId + '\'.\r\n' + error.message);
                        });
                }, function (t, error) {
                    console.error("Error while checking if message exists.\r\n" + error.message);
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
        }

        factory.messageUpdated = function (data) {
            $rootScope.$broadcast('message-updated', data);
        }
        factory.messagesChanged = function (data) {
            $rootScope.$broadcast('messages-changed', data);
        }

        factory.on = function (event, data) {
            switch (event.name) {
                case 'updated-message':
                    break;
                case 'new-messages':
                    if (data != null) {
                        console.log("Received new messages: " + data.length);
                        for (var i = 0; i < data.length; i++) {
                            factory.addMessage(data[i]);
                        }
                    }
                    break;
                case 'device-ready':
                    factory.init();
                    break;
                case 'logged-out':
                    localStorage.removeItem('latestWhatIsNewUpdate');
                    // Clearing Table on logout, just to be sure
                    // TODO: Should this really be done here, like this?!?
                    db.transaction(function (tx) {
                        tx.executeSql(queries.dropTable, [], function () {});
                    });
                    break;
                case 'logged-in':
                    // Clearing Table on login, just to be sure
                    // TODO: Should this really be done here, like this?!?
                  /*  db.transaction(function (tx) {
                        tx.executeSql(queries.dropTable, [], function () {});
                    }); */
                    factory.init();
                    break;
                default:
                    break;
            }
        }
        factory.init();
        return factory;
    }])
