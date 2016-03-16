/**
 * Created by Robin Jobb on 2016-03-16.
 */
mobileresponseWebbApp
    .filter('startFrom', function () {
        return function (input, start) {
            start = +start;
            return input.slice(start);
        }
    })
    .filter('reverse', function() {
        return function(items) {
            return items.slice().reverse();
        };
    })
