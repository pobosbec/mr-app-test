/**
 * Created by robinpipirs on 11/12/15.
 */
var mobileresponseWebbApp = angular.module('administratorApp', [
    'ngCordova',
    'ngAnimate',
    'ngResource',
    'ui.router',
    'oc.lazyLoad',
    'ui.bootstrap',
    'token',
    'messages',
    'login',
    'message'
]).run(function ($cordovaSQLite) {
    //document.addEventListener('deviceready', function () {
    setTimeout(function () {
        console.log("run.deviceready");

        console.log("1");
        try {
            var db = $cordovaSQLite.openDB({ name: "bosbec1.db" });
            alert("yay" + db);
        } catch (e) {
            alert("nay" + e);
        }

        console.log("2");

        console.log(db);

        console.log("3");
        //}, false);
    },5000)
})