/**
 * Created by Kristofer Holmgren on 23/05/16.
 */

angular.module('logging', [])
    .factory('logService', ['$q', 'databaseService', function ($q, databaseService) {
        var factory = {};

        var db = null;
        
        factory.capturedLogs = null;

        factory.init = function () {
            db = databaseService.db;
            factory.capturedLogs = [];
        }

        factory.options = {
            targets: {
                console: true,
                database: true,
                eventView: true
            },
            saveToDbLevel: []
        }

        factory.logMessage = function (text, createdOn, metadata, level) {

            var logLevel = determineLogLevel(level);

            function getLogTime(createdOn) {
                if (createdOn === null || createdOn === undefined) {
                    return new Date().toJSON() + '(Log-service)';
                } else {
                    return createdOn;
                }
            }

            var message = {
                text: text,
                createdOn: getLogTime(createdOn),
                metadata: metadata,
                level: logLevel
            };

            function consoleLog(message, level) {
                var line = '';

                if (message.metadata === undefined || message.metadata === null) {
                    line = message.createdOn + ':' + message.text;
                } else {
                    line = message.createdOn + ':' + message.text + ':' + JSON.stringify(message.metadata);
                }

                switch (level) {
                    case 'info':
                        console.info(line);
                        break;
                    case 'warn':
                        console.warn(line);
                        break;
                    case 'error':
                        console.error(line);
                        break;
                    case 'debug':
                        console.debug(line);
                        break;
                    case 'log':
                        console.log(line);
                        break;
                    default:
                        console.log(line);
                        break;
                }
            }

            function insertLog(message) {
                return $q(function (resolve, reject) {
                    db.transaction(function (tx) {
                        tx.executeSql(
                            'INSERT INTO Logs (CreatedOn, Message, Metadata, Level) VALUES (?, ?, ?, ?)',
                            [
                                message.createdOn,
                                message.text,
                                JSON.stringify(message.metadata),
                                message.level],
                            function (trans, result) {
                                resolve();
                            },
                            function (t, error) {
                                reject(error);
                            });
                    });
                });
            }

            function determineLogLevel(level) {
                switch (level) {
                    case 'info':
                        return level;
                    case 'warn':
                        return level;
                    case 'error':
                        return level;
                    case 'log':
                        return level;
                    case 'debug':
                        return level;
                    default:
                        return 'log';
                }
            }

            if (factory.options.targets.console) {
                consoleLog(message, logLevel);
            }

            if (factory.options.targets.database) {
                if (db == null) {
                    console.log('Db was null, output redirected to console.');
                    consoleLog(message, logLevel);
                } else {
                    insertLog(message);
                }
            }

            if (factory.options.targets.eventView) {
                factory.capturedLogs.unshift(message);
            }
        }

        function formatMessage(input) {
            var returnV = null;

            if (input.constructor === Object) {
                if (input.type === 'logMessage') {
                    returnV = input;
                } else {
                    returnV = {
                        metadata: JSON.stringify(input)
                    }
                }
            } else if (input.constructor === String) {
                returnV = {
                    text: input
                }
            }

            return returnV;
        }

        factory.log = function (message) {
            message = formatMessage(message);
            factory.logMessage(message.text, message.createdOn, message.metadata, 'log');
        }

        factory.info = function (message) {
            message = formatMessage(message);
            factory.logMessage(message.text, message.createdOn, message.metadata, 'info');
        }

        factory.warn = function (message) {
            message = formatMessage(message);
            factory.logMessage(message.text, message.createdOn, message.metadata, 'warn');
        }

        factory.error = function (message) {
            message = formatMessage(message);
            factory.logMessage(message.text, message.createdOn, message.metadata, 'error');
        }

        factory.debug = function (message) {
            message = formatMessage(message);
            factory.logMessage(message.text, message.createdOn, message.metadata, 'debug');
        }

        factory.getLogsFromDb = function() {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(
                        'SELECT * FROM Logs ORDER BY CreatedOn DESC', [],
                        function (trans, result) {
                            var rows = getRows(result);
                            
                            resolve(rows);
                        },
                        function (t, error) {
                            reject(error);
                        });
                });
            });
        }

        factory.clearCapturedLogs = function () {
            factory.capturedLogs.length = 0;
        }

        factory.clearLogTable = function () {

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

        return factory;
    }]);
