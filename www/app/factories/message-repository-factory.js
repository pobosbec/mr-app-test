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
                          var author = factory.authors.filter(function(v) {
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

          factory.addMessage = function (data) {
              if (data.hasOwnProperty("MessageId")) {
                  var oldMessagesWithId = factory.messages.filter(function(v) {
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
                  var oldMessagesWithCreatedOnAndAuthor = factory.messages.filter(function(v) {
                      return v.CreatedOn === data.CreatedOn && v.Author === data.Author;
                  });
                  if (oldMessagesWithCreatedOnAndAuthor && oldMessagesWithCreatedOnAndAuthor.constructor === Array && oldMessagesWithCreatedOnAndAuthor.length > 0) {
                      return;
                  }
                  factory.messages.push(data);
                  factory.saveMessages();
                  factory.messageAdded(data);
              } else {
                  //This should not handle message after we go live..
                  //factory.messages.push(data);
                  //factory.saveMessages();
                  //factory.messageAdded(data);
                  console.log("Malformed message recieved. Ignoring.");
              }
          }

          factory.saveMessages = function () {
              if (typeof (Storage) !== "undefined") {
                  var messages = JSON.stringify(factory.messages);
                  localStorage.setItem('messages', messages);
              } else {
                  alert("ach nein! keiner storage!!!1");
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

          factory.on = function (event, data) {
              switch (event.name) {
                  case 'updated-message':
                      //console.log("updated-message");
                      break;
                  case 'new-messages':
                      //console.log("new-messages");
                      if (data != null) {
                          for (i = 0; i < data.length; i++) {
                              factory.addMessage(data[i]);
                          }
                      }
                      break;
                  case 'device-ready':
                      factory.init();
                      break;
                  default:
                      break;
              }
          }

          factory.test = function () {
              var data = [{
                  MessageId: "30952957-476B-4760-9B04-632A198D2F1B",
                  Author: "956EF224-E73B-453A-97BA-DDEBFAAA9D17",
                  CreatedOn: "2016-02-12 15:36:05",
                  Content: "(4 sek)något meddelande1",
                  Comments: null,
                  MetaData: []
              }];
              $rootScope.$broadcast('new-messages', data);
          };

          factory.test2 = function () {
              var data = [{
                  MessageId: "30952957-476B-4760-9B04-632A198D2F1C",
                  Author: "37F57046-F1FD-4EEC-8E31-BB74246EB0AC",
                  CreatedOn: "2016-01-01 05:05:05",
                  Content: "(8 sek)något meddelande2, äldst datum, med bild i metadata",
                  Comments: null,
                  MetaData: [] //{
                  //    url: "http://f6e33e1022533c629b47-4893d13bf206ba63c48db8211834dce5.r9.cf2.rackcdn.com/2016-03-07+15-08-18.jpg",
                  //    urlRotation: 6,
                  //    thumbnail: "http://f6e33e1022533c629b47-4893d13bf206ba63c48db8211834dce5.r9.cf2.rackcdn.com/2016-03-07+15-08-18thumb.jpg",
                  //    thumbnailRotation: 0,
                  //    value: "http://f6e33e1022533c629b47-4893d13bf206ba63c48db8211834dce5.r9.cf2.rackcdn.com/2016-03-07+15-08-18.jpg,6,http://f6e33e1022533c629b47-4893d13bf206ba63c48db8211834dce5.r9.cf2.rackcdn.com/2016-03-07+15-08-18thumb.jpg",
                  //    contentType: "image/jpeg",
                  //    name: "Image",
                  //    createdOn: "2016-03-07T14:08:19",
                  //    groupOrder: 1,
                  //    _type: "image"
                  //}
              }];

              $rootScope.$broadcast('new-messages', data);
          }

          factory.test3 = function () {
              var data = [{
                  MessageId: "30952957-476B-4760-9B04-632A198D2F1D",
                  Author: "956EF224-E73B-453A-97BA-DDEBFAAA9D17",
                  CreatedOn: "2016-01-05 05:05:05",
                  Content: "(12 sek)något meddelande3",
                  Comments: null,
                  MetaData: []
              }];

              $rootScope.$broadcast('new-messages', data);
          }

          factory.testingtesting = setTimeout(function () { factory.test() }, 4000);
          factory.testingtesting2 = setTimeout(function () { factory.test2() }, 8000);
          factory.testingtesting3 = setTimeout(function () { factory.test3() }, 12000);

          factory.init();
          return factory;
      }])
