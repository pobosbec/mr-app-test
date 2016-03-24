/**
 * Created by Magnus Svensson on 09/03/16.
 */

angular.module('message', ['ngCordova'])
      .factory('messageRepository', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', '$cordovaSQLite', function ($http, win, $rootScope, $location, $q, $state, tokenService, $cordovaSQLite, angularMoment) {
          var db;

          var factory = {};

          var dabataseConfiguration = {
              name: "bosbec-mr.db",
              location: 1,
              version: "1.0",
              displayName: "Bosbec-Mr",
              size: (5 * 1024 * 1024)
          }

          var sqliteQueries = {
              dropTable: 'DROP TABLE IF EXISTS Messages',
              createTable: 'CREATE TABLE IF NOT EXISTS Messages (MessageId blob unique key, CreatedOn integer, ConversationId blob, Author blob, JSON blob)',
              getAllMessages: 'SELECT * FROM Messages ORDER BY CreatedOn DESC',
              getLatestMessages: 'SELECT * FROM Messages ORDER BY CreatedOn DESC LIMIT ?',
              getAllMessagesFromAuthor: 'SELECT * FROM Messages WHERE Author=?',
              getAllMessagesFromConversation: 'SELECT * FROM Messages WHERE ConversationId=?',
              insertMessages: 'INSERT INTO Messages (MessageId, CreatedOn, ConversationId, Author, JSON) VALUES (?, ?, ?, ?, ?)'
          }

          var webSqlQueries = {
              dropTable: 'DROP TABLE IF EXISTS Messages',
              createTable: 'CREATE TABLE IF NOT EXISTS Messages (MessageId unique, CreatedOn, ConversationId, Author, JSON)',
              getAllMessages: 'SELECT * FROM Messages ORDER BY CreatedOn DESC',
              getLatestMessages: 'SELECT * FROM Messages ORDER BY CreatedOn DESC LIMIT ?',
              getAllMessagesFromAuthor: 'SELECT * FROM Messages WHERE Author=?',
              getAllMessagesFromConversation: 'SELECT * FROM Messages WHERE ConversationId=?',
              insertMessages: 'INSERT INTO Messages (MessageId, CreatedOn, ConversationId, Author, JSON) VALUES (?, ?, ?, ?, ?)'
          }

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

              console.log("create");
              db.transaction(function (tx) {
                  tx.executeSql(queries.createTable, [], function (result, data) {
                      tx.executeSql("SELECT * FROM Messages", [], function (result, resultData) {
                          for (var i = 0; i < resultData.rows.length; i++) {
                              var insertMessage = JSON.parse(resultData.rows[i].JSON);
                              insertMessage.Content = "[LÄST FRÅN DB] "+insertMessage.Content;
                              factory.messages.push(insertMessage);
                          }
                          factory.messageAdded(factory.messages);
                      });
                      $rootScope.$broadcast('download-whats-new');
                  }, function (result) {
                      console.error(result);
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


          factory.getMessages = function () {
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
          }

          factory.getNewestMessage = function () {
              return factory.getMessages()[0];
          }

          factory.getOldestMessage = function () {
              return factory.getMessages().reverse()[0];
          }

          factory.addMessage = function (data) {
              db.transaction(function (tx) {
                  tx.executeSql("SELECT * FROM Messages WHERE MessageId=?", [data.MessageId], function (result, resultData) {
                      // Experimental merge to minimize ammounts of fired events.
                      // Doesn't seem to help though...
                      var addedMessages = [];
                      if (resultData.rows.length === 0) {
                          db.transaction(function (tx) {
                              tx.executeSql(queries.insertMessages, [data.MessageId, moment(data.CreatedOn).unix(), data.ConversationId, data.Author, JSON.stringify(data)], function (result) {
                                  //console.log("Inserting new; Success!");
                                  factory.messages.push(data);
                                  addedMessages.push(data);
                                  //factory.messageAdded(data); // <- old usage
                              }, function (err) {
                                  console.error("Error when inserting message in Database:");
                                  console.error(data);
                              });
                          });
                      } else {
                          // Message already present in DB.
                      }
                      // Experimental merge to minimize ammounts of fired events.
                      // Doesn't seem to help though...
                      factory.messageAdded(addedMessages); 

                  }, function (err) {
                      console.error("Error when inserting message in Database.");
                  });
              });
          }

          factory.messageAdded = function (data) {
              console.log("messages-added event");
              $rootScope.$broadcast('messages-added', data);
          }
          factory.messageUpdated = function (data) {
              $rootScope.$broadcast('message-updated', data);
          }
          factory.messagesChanged = function (data) {
              $rootScope.$broadcast('messages-changed', data);
          }

          var throttled = [];

          function throttle(callback, interval) {
              //console.log("throttle");
              throttled.push({ callback: callback, interval: interval, executing: false });
              if (throttled[0].hasOwnProperty("executing") && !throttled[0].executing) {
                  //console.log("queued new!");
                  throttled[0].executing = true;
                  setTimeout(executeThrottled, throttled[0].interval);
              }
          }

          function executeThrottled() {
              //console.log("executeThrottled");
              if (throttled[0]) {
                  if (throttled[0].executing) {
                      //console.log("execute!");
                      throttled[0].callback();
                      throttled.shift();
                      if (throttled[0] && throttled[0].hasOwnProperty("executing") && !throttled[0].executing) {
                          //console.log("queued new");
                          throttled[0].executing = true;
                          setTimeout(executeThrottled, throttled[0].interval);
                      }
                  }
              }
          }


          factory.on = function (event, data) {
              switch (event.name) {
                  case 'updated-message':
                      break;
                  case 'new-messages':
                      console.log("NEW MESSAGES: " + data.length);
                      if (data != null) {
                          for (var i = 0; i < data.length; i++) {
                              var callback = function (thisElement) {
                                  return function () {
                                      factory.addMessage(thisElement);
                                  }
                              }(data[i]);
                              
                              throttle(callback, 10);
                              //factory.addMessage(data[i]);
                          };
                      }
                      break;
                  case 'device-ready':
                      factory.messages = [];
                      factory.init();
                      break;
                  case 'logged-out':
                      throttled = [];
                      factory.messages = [];
                      localStorage.removeItem('messages');
                      localStorage.removeItem('latestWhatIsNewUpdate');
                      // Clearing Table on logout, just to be sure
                      db.transaction(function (tx) {
                          tx.executeSql(queries.dropTable, [], function () {});
                      });
                      break;
                  case 'logged-in':
                      // Clearing Table on login, just to be sure
                      db.transaction(function (tx) {
                          tx.executeSql(queries.dropTable, [], function () { });
                      });
                      factory.init();
                      break;
                  default:
                      break;
              }
          }
          factory.init();
          return factory;
      }])
