exports.callable = function (obj, methodName) {
    const handler = {
        get: function (self, key) {
            return self.__inherit__[key];
        },
        apply: function (self, thisValue, args) {
            if (typeof methodName !== "undefined" && typeof obj[methodName] !== "undefined") {
                return obj[methodName].apply(self, args);
            }
            return (self.__call__ || self.__inherit__.__call__).apply(self, args);
        }
    }
    var p = new Proxy(function () { }, handler);
    p.__inherit__ = obj;
    return p;
}

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