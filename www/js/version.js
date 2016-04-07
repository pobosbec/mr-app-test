// Major version change requires re-download of entire App.
// Minor version change requires re-download of web content.
if (typeof version === 'undefined') {
    var version = {}
    version.local = {}
    version.local.major = 0;
    version.local.minor = 2;
    version.local.fullVersion = version.local.major + "." + version.local.minor;
    version.upToDate = null;
} else {
    version.remote = {}
    version.remote.major = 0;
    version.remote.minor = 2;
    version.remote.fullVersion = version.remote.major + "." + version.remote.minor;
    version.upToDate = version.local.fullVersion === version.remote.fullVersion;

    // Here we should dispatch an event.
    var versionEvent = document.createEvent('CustomEvent');
    versionEvent.initCustomEvent('version-information', true, true, version);

    window.addEventListener("load", function load(event) {
        document.dispatchEvent(versionEvent);
    }, false);
;

    document.addEventListener('deviceready', function (event, args) {
        document.dispatchEvent(versionEvent);
    }, false);
}