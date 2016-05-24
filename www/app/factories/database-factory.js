/**
 * Created by Kristofer Holmgren on 23/05/16.
 */

angular.module('database', [])
    .factory('databaseService', ['$q', function ($q) {
        var factory = {};

        factory.databaseConfiguration = {
            name: "bosbec-mr.db",
            location: 1,
            version: "1.0",
            displayName: "Bosbec-Mr",
            size: (5 * 1024 * 1024)
        };

        factory.console = console;

        factory.db = {};

        factory.isReady = false;

        factory.openDatabase = function () {
            var deferred = $q.defer();

            var databaseConfiguration = {
                name: "bosbec-mr.db",
                location: 1,
                version: "1.0",
                displayName: "Bosbec-Mr",
                size: (5 * 1024 * 1024)
            };

            try {
                factory.db = window.openDatabase(databaseConfiguration.name, databaseConfiguration.version, databaseConfiguration.displayName, databaseConfiguration.size);
                deferred.resolve();
            } catch (e) {
                deferred.reject('Could not open database.');
            }

            return deferred.promise;
        };

        factory.init = function () {
            return $q(function (resolve, reject) {
                factory.openDatabase().then(function () {
                    factory.createTables().then(function () {
                        resolve();
                    }, function (error) {
                        reject();
                    });
                }, function (error) {
                    reject();
                });
            });
        };

        factory.on = function (event) {

            return $q(function (resolve, reject) {
                switch (event.name) {
                    case 'logged-in':
                        factory.dropAllTables().then(function () {
                            factory.createTables().then(function () {
                                resolve();
                            });
                        }, function (error) {
                            reject(error);
                        });
                        break;
                    case 'logged-out':
                        factory.dropAllTables(function () { });
                        break;
                    default:
                }
            });
        }

        factory.createTables = function () {

            var deferred = $q.defer();

            factory.db.transaction(function (tx) {
                tx.executeSql('CREATE TABLE IF NOT EXISTS Messages (MessageId primary key, CreatedOn, ConversationId, Author, JSON)');
                tx.executeSql('CREATE TABLE IF NOT EXISTS AppUsers (AppUserId text primary key, DisplayName text, JSON text)');
                tx.executeSql('CREATE TABLE IF NOT EXISTS ConversationParticipants (ConversationId primary key, Participants)');
                tx.executeSql('CREATE TABLE IF NOT EXISTS Logs (CreatedOn, Message, Metadata, Level)');
                tx.executeSql('CREATE TABLE IF NOT EXISTS LogTargets (Target primary key, State BOOLEAN)');
                console.log('All tables created.');
                deferred.resolve();
            }, function (transaction, error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }

        factory.dropAllTables = function () {
            return $q(function (resolve, reject) {
                var promises = [];
                promises.push(factory.dropTable('Messages'));
                promises.push(factory.dropTable('AppUsers'));
                promises.push(factory.dropTable('ConversationParticipants'));

                $q.all(promises).then(function (values) {
                    console.log('All tables dropped.');
                    resolve();
                }, function (error) {
                    console.log(error);
                    reject();
                });
            });
        };

        factory.dropTable = function (name) {
            return $q(function (resolve, reject) {
                factory.db.transaction(function (tx) {
                    tx.executeSql('DROP TABLE IF EXISTS ' + name, [], function () {
                        resolve();
                    }, function (transaction, error) {
                        reject(error);
                    });
                });
            });
        }

        return factory;
    }]);
