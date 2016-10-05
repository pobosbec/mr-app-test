var version = null;

var versionEvent = document.createEvent('CustomEvent');

var readConfigFile = function() {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", function () {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xhr.responseText, "application/xml");
        version = doc.getElementsByTagName("widget").item(0).attributes.version.value;
        versionEvent.initCustomEvent('version-information', true, true, version);
        document.dispatchEvent(versionEvent);
    });
    xhr.open("get", "../config.xml", true);
    xhr.send();
}

window.addEventListener("load", function load(event) {
    readConfigFile();
}, false);

document.addEventListener('deviceready', function (event, args) {
    if (cordova !== null && typeof cordova !== "undefined" && cordova.getAppVersion !== null && typeof cordova.getAppVersion !== "undefined") {
        cordova.getAppVersion.getVersionNumber(function(ver) {
            version = ver;
            versionEvent.initCustomEvent('version-information', true, true, version);
            document.dispatchEvent(versionEvent);
        });
    } else {
        readConfigFile();
    }
}, false);