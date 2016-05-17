/**
 * Created by Magnus Svensson on 09/03/16.
 */

angular.module('repository', [])
    .factory('baseRepository', ['$q', function ($q) {
        var factory = {};

        factory.db = {};

        factory.init = function () {

            var deferred = $q.defer();

            var databaseConfiguration = {
                name: "bosbec-mr.db",
                location: 1,
                version: "1.0",
                displayName: "Bosbec-Mr",
                size: (5 * 1024 * 1024)
            };

            factory.db = window.openDatabase(databaseConfiguration.name, databaseConfiguration.version, databaseConfiguration.displayName, databaseConfiguration.size);

            factory.db.transaction(function (tx) {
                tx.executeSql('CREATE TABLE IF NOT EXISTS Messages (MessageId primary key, CreatedOn, ConversationId, Author, JSON)');
                tx.executeSql('CREATE TABLE IF NOT EXISTS AppUsers (AppUserId text primary key, DisplayName text, JSON text)');
                tx.executeSql('CREATE TABLE IF NOT EXISTS ConversationParticipants (ConversationId primary key, Participants)');
                deferred.resolve();
            });

            return deferred.promise;
        }

        return factory;
    }]);
