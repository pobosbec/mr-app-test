/**
 * Created by Kristofer on 2016-03-21.
 */
angular.module('contacts', [])
    .factory('contactsService', ['$http', '$rootScope', '$q', 'tokenService', 'databaseService', 'logService', function ($http, $rootScope, $q, tokenService, databaseService, logService) {

        var db;
        var factory = {};
        var queries = null;

        var webSqlQueries = {
            dropAppUsers: 'DROP TABLE IF EXISTS AppUsers',
            createAppUsers: 'CREATE TABLE IF NOT EXISTS AppUsers (AppUserId text primary key, DisplayName text, JSON text)',
            getAppUsers: 'SELECT * FROM AppUsers',
            insertAppUser: 'INSERT OR REPLACE INTO AppUsers (AppUserId, DisplayName, JSON) VALUES (?, ?, ?)',
            doesAppUserExist: 'SELECT COUNT(*) AS cnt FROM AppUsers WHERE AppUserId=?',
            updateAppUser: 'UPDATE AppUsers SET JSON=? WHERE AppUserId=?',
            getAppUser: 'SELECT * FROM AppUsers WHERE AppUserId=?',
            deleteAppUser: 'DELETE FROM AppUsers WHERE AppUserId=?'
        };

        factory.appUsers = [];
        factory.contacts = [];
        factory.inboxId = '8a0958a2-a163-4a20-8afa-e7315012e2d8';

        factory.getUsername = function (appUserId) {
            var found = null;

            for (var i = 0; i < factory.appUsers.length; i++) {
                var appUser = factory.appUsers[i];
                if (typeof appUser !== "undefined" && appUser.hasOwnProperty("id")) {
                    if (appUser.id === appUserId) {
                        found = factory.appUsers[i].displayName;
                        break;
                    }
                }
            }

            if (found != null) {
                return found;
            }

            return '..';
        };

        factory.init = function init() {
            queries = webSqlQueries;
            db = databaseService.db;
            var promise = factory.getAppUsers();
            promise.then(function (success) {
                success.some(function(appUser) {
                    factory.appUsers.push(appUser);
                });
            }, function (error) {
                
            });
        }

        factory.findAppUsersFromAllContacts = function () {
            var query = ['+46704738757', 'bjorn@bosbec.se'];

            if (contacts == null || contacts == undefined) {
                return;
            }

            var promise = factory.loadContacts();

            promise.then(
                function (success) {
                    for (var i = 0; i < contacts.length; i++) {
                        var contact = contacts[i];

                        if (contact.phoneNumbers != null || contact.phoneNumbers != undefined) {
                            for (var j = 0; j < contact.phoneNumbers.length; j++) {
                                query.push(contact.phoneNumbers[j].value);
                            }
                        }

                        if (contact.emails != null || contact.emails != undefined) {
                            for (var k = 0; k < contact.emails.length; k++) {
                                query.push(contact.emails[k].value);
                            }
                        }
                    }

                    var req = {
                        method: 'POST',
                        ignoreLoadingBar: true,
                        url: tokenService.currentAppApiUrl + 'app/inboxes/search-multiple',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: {
                            Data: {
                                InboxId: inboxId,
                                Queries: query
                            },
                            AuthenticationToken: tokenService.getAppAuthToken()
                        }
                    };

                    var promise = tokenService.httpPost(req);

                    promise.then(function (success) {
                        for (var i = 0; i < success.data.length; i++) {
                            factory.addOrUpdateAppUser(success.data[i]);
                        }
                    }, function (error) {
                        logService.log('Could not get app-users.')
                    });
                },
                function (error) {
                    logService.log('Could not get phone contacts.')
                });
        }

        factory.searchAppUser = function (query) {

            var deferred = $q.defer();

            var req = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: tokenService.currentAppApiUrl + 'app/users/search',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        InboxId: factory.inboxId,
                        SearchFor: query
                    },
                    AuthenticationToken: tokenService.getAppAuthToken()
                }
            };

            var promise = tokenService.httpPost(req);

            promise.then(function (success) {
                deferred.resolve(success);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

        factory.getPhoneContacts = function () {

            var deferred = $q.defer();

            try {
                var options = new ContactFindOptions();
                options.multiple = true;
                var fields = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
                navigator.contacts.find(fields,
                    function (phoneContacts) {
                        contacts = phoneContacts;
                    },
                    function () {
                        logService.log('Could not get contacts!')
                    }, options);
                deferred.resolve("Success");
            } catch (error) {
                logService.log('Could not get contacts from phone.')
                deferred.reject("Fail");
            }

            return deferred.promise;
        };

        factory.getAppUsers = function () {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.getAppUsers, [],
                        function (trans, result) {
                            var appUsers = [];
                            var rows = getRows(result);

                            for (var i = 0; i < rows.length; i++) {
                                var row = rows[i];
                                if (row !== null && typeof row !== "undefined" && row.hasOwnProperty('JSON')) {
                                    try {
                                        appUsers.push(JSON.parse(row.JSON));
                                    } catch (err) {
                                        logService.error('Failed to parse appUser \'' + row[i].userId + '\'.\r\n' + err);
                                    }
                                }
                            }
                            resolve(appUsers);
                        }, function (trans, error) {
                            logService.error('Error while fetching appUsers from database.\r\n' + error.message);
                            reject(error);
                        });
                });
            });
        }

        factory.userExists = function (appUserId) {

            var deferred = $q.defer();

            var found = factory.appUsers.some(function (appUser) {
                if (appUserId === appUser.UserId) {
                    return true;
                }
            });

            var returnResult = { Found: false, Id: null };

            if (found) {
                returnResult.Found = true;
                deferred.resolve(returnResult);
            } else {
                var foundPromise = factory.getAppUser(appUserId);

                foundPromise.then(function (success) {
                    if (success.length === 1) {
                        factory.appUsers.push(success);
                        returnResult.Found = true;
                        deferred.resolve(returnResult);
                    } else {
                        returnResult.Found = false;
                        returnResult.Id = appUserId;
                        deferred.resolve(returnResult);
                    }

                }, function (error) {
                    returnResult.Found = false;
                    returnResult.Id = appUserId;
                    deferred.resolve(returnResult);
                });
            }

            return deferred.promise;
        }

        factory.getAppUser = function (appUserId) {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.getAppUser, [appUserId],
                        function (trans, result) {
                            var appUsers = [];
                            var rows = getRows(result);

                            for (var i = 0; i < rows.length; i++) {
                                var row = rows[i];
                                if (row !== null && typeof row !== "undefined" && row.hasOwnProperty('JSON')) {
                                    try {
                                        appUsers.push(JSON.parse(row['JSON']));
                                    } catch (err) {
                                        logService.error('Failed to parse appUser \'' + row[i].userId + '\'.\r\n' + err);
                                    }
                                }
                            }

                            resolve(appUsers);
                        }, function (trans, error) {
                            logService.error('Error while fetching appUsers from database.\r\n' + error.message);
                            reject(error);
                        });
                });
            });
        }

        factory.removeUser = function (appUserId) {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(queries.deleteAppUser, [appUserId],
                        function (trans, result) {
                            if (result.rowsAffected !== 1) {
                                logService.error('Error while fetching appUsers from database.\r\n' + error.message);
                                reject();
                            }
                            resolve(result);
                        }, function (trans, error) {
                            logService.error('Error while fetching appUsers from database.\r\n' + error.message);
                            reject(error);
                        });
                });
            });
        }

        factory.dropUsersTable = function () {
            dropDatabase();
        }

        factory.on = function (event, args) {
            switch (event.name) {
                case 'logged-in':
                    factory.appUsers.length = 0;
                    factory.init();
                    break;
                case 'logged-out':
                    factory.appUsers.length = 0;
                    break;
                default:
                    break;
            }
        }

        // TODO: Make to promise
        /**
         * Adds an appUser to the database
         * @param {appUser} the appUser to add
         */
        factory.addAppUser = function (appUser) {
            if (!appUser.hasOwnProperty('UserId')) {
                //logService.log("repaired app user");
                appUser.UserId = appUser.id;
            }
            if (!appUser.hasOwnProperty('id')) {
                //logService.log("repaired app user");
                appUser.id = appUser.UserId;
            }
            db.transaction(function (tx) {
                logService.log('Checking if app-user with id \'' + appUser.id + '\' exists.');
                tx.executeSql(queries.doesAppUserExist, [appUser.id], function (transaction, resultData) {
                    var rows = getRows(resultData);
                    if (rows.length !== 1) {
                        logService.error('Unexpected number of rows returned (' + rows.length + '). Check sql statement!');
                        return;
                    }

                    // TODO: update user instead?
                    if (rows.length && rows[0] !== null && typeof rows[0] !== "undefined" && rows[0].hasOwnProperty('cnt') && rows[0].cnt !== 0) {
                        logService.log('AppUser width id \'' + appUser.id + '\' exists, won\'t insert.');
                        return;
                    }
                    factory.insertAppUser(appUser)
                        .then(function () {
                            factory.appUsers.push(appUser);
                            logService.log('Added appUser with id \'' + appUser.UserId + '\'');
                        }, function (error) {
                            logService.error('Error while inserting appUser with id \'' + appUser.UserId + '\'.\r\n' + error.message);
                        });
                }, function (t, error) {
                    logService.error("Error while checking if appUser exists.\r\n" + error.message);
                });
            });
        };

        /**
         * Gets the rows from a sql query result and returns them as an array
         * @param {sqlResult} the result from a sql query
         */
        function getRows(result) {
            var rows = [];

            for (var i = 0; i < result.rows.length; i++) {
                rows.push(result.rows.item(i));
            }

            return rows;
        }


        /**
             * Inserts the appUser to the database
             * @param appUser to insert
             * @returns {promise} returns a promise
             */
        factory.insertAppUser = function (appUser) {
            return $q(function (resolve, reject) {
                db.transaction(function (tx) {
                    tx.executeSql(
                        queries.insertAppUser,
                        [
                            appUser.id,
                            appUser.displayName,
                            JSON.stringify(appUser)],
                        function (trans, result) {
                            if (result.rowsAffected !== 1) {
                                logService.error('');
                                reject(new {
                                    message: 'The appUser width id \'' + appUser.id + '\' doesn\'t seem to be added properly'
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

        return factory;
    }])