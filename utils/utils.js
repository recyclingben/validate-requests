/**
 * Allows given object to be called like a method. When called like a method, method is called. If no function is provided, __call__ will be called on the object instead.
 * 
 * @param {Object} obj - Object to be called like a method
 * @param {Function} [fn] - Called when object called like a method
 * @returns {Object} - New callable object
 */
exports.callable = function (obj, fn) {
    if (typeof fn !== "undefined") {
        fn = fn.bind(obj);
    }

    const handler = {
        get: function (self, key) {
            return self.__inherit__[key];
        },
        apply: function (self, thisValue, args) {
            if (typeof fn !== "undefined") {
                return fn.apply(self, args);
            }
            return (self.__call__ || self.__inherit__.__call__).apply(self, args);
        }
    }
    var p = new Proxy(function () { }, handler);
    p.__inherit__ = obj;
    return p;
}

/**
 * Takes obects' values and merges them with precedence from left to right.
 * 
 * @param {...Object} objects Objects 
 * @returns {Object} - Resulting object
 */
exports.defaults = function (...objects) {
    const result = {};
    for (const object of objects) {
        if (typeof object === "undefined") {
            continue;
        }
        for (const [key, value] of Object.entries(object)) {
            if (typeof result[key] === "undefined") {
                result[key] = value;
            }
        }
    }
    return result;
}