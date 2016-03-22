/**
 * Created by Magnus Svensson on 09/03/16.
 */

angular.module('message', ['ngCordova'])
      .factory('messageRepository', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', '$cordovaSQLite', function ($http, win, $rootScope, $location, $q, $state, tokenService, $cordovaSQLite) {
          var factory = {};
          factory.dabataseConfiguration = {
              db: "bosbec1.db"
          }

          factory.messages = [];

          factory.init = function () {
              $rootScope.$broadcast('download-whats-new');
              var readStorage = JSON.parse(localStorage.getItem('messages'));
              if (readStorage && readStorage.constructor === Array) {
                  factory.messages = readStorage;
                  factory.messageAdded(factory.messages);
              }
          }

          factory.dabataseConnection = function () {
              return "";
          }

          factory.authors = [{
              Id: "956EF224-E73B-453A-97BA-DDEBFAAA9D17",
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
              if (data.hasOwnProperty("MessageId")) {
                  var oldMessagesWithId = factory.messages.filter(function (v) {
                      return v.MessageId === data.MessageId;
                  });
                  if (oldMessagesWithId && oldMessagesWithId.constructor === Array && oldMessagesWithId.length > 0) {
                      //factory.messages.push(data); //<--- change!
                      return;
                  } else {
                      factory.messages.push(data);
                  }
                  factory.saveMessages();
                  factory.messageAdded(data);
              } else if (data.hasOwnProperty("CreatedOn") && data.hasOwnProperty("Author")) {
                  var oldMessagesWithCreatedOnAndAuthor = factory.messages.filter(function (v) {
                      return v.CreatedOn === data.CreatedOn && v.Author === data.Author;
                  });
                  if (oldMessagesWithCreatedOnAndAuthor && oldMessagesWithCreatedOnAndAuthor.constructor === Array && oldMessagesWithCreatedOnAndAuthor.length > 0) {
                      return;
                  }
                  factory.messages.push(data);
                  factory.saveMessages();
                  factory.messageAdded(data);
              } else {
                  console.log("Malformed message recieved. Ignoring.");
              }
          }

          factory.saveMessages = function () {
              console.warn("Saving messages");
              if (typeof (Storage) !== "undefined") {
                  var messages = JSON.stringify(factory.messages);
                  if (typeof messages === "undefined" || messages === null) {
                      console.error("Messages was null when saving!! Not good, ignoring ignoring ignoring....");
                  } else {
                      localStorage.setItem('messages', messages);
                  }
              } else {
                  alert("ach nein! keiner storage!!!1");
                  alert("This is actually not a good thing.. We would like you (yes YOU) to contact us and tell us at Bosbec what platform you are running on.");
                  return;
              }
          };

          factory.messageAdded = function (data) {
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
                      if (data != null) {
                          for (var i = 0; i < data.length; i++) {
                              var callback = function (thisElement) {
                                  return function () {
                                      factory.addMessage(thisElement);
                                  }
                              }(data[i]);
                              throttle(callback, 10);
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
                      break;
                  case 'logged-in':
                      factory.init();
                      break;
                  default:
                      break;
              }
          }
          factory.init();
          return factory;
      }])
