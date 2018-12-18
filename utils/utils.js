/**
 * Allows given object to be called like a method. When called like a method, method is called. If no function is provided, __call__ will be called on the object instead.
 * 
 * @param {Object} obj - Object to be called like a method
 * @param {Function} [fn] - Called when object called like a method
 * @returns {Object} - New callable object
 */
exports.callable = function (type, fnKey = "__call__") {
    /* Allows use of static members of class. On construction, then allow callability. */
    return new Proxy(type, {
        construct(target, args) {
            return create(new target(...args));
        }
    });

    function create(obj) {
        var p = new Proxy(function () { }, {
            get(target, key) {
                return target.__inherit__[key];
            },
            apply(target, thisArg, args) {
                return (obj[fnKey]).apply(target, args);
            }
        });
        p.__inherit__ = obj;
        return p;
    }
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

/**
 * Takes string and capitalizes first character, while optionally lower-casing the rest.
 * 
 * @param {string} str - String to capitalize
 * @param {boolean} [lowerRest=false] - Whether or not to lower-case the rest of the letters
 * @returns {string} - Resulting string
 */
exports.case = {
    capitalize(str, lowerRest = false) {
        if (lowerRest) {
            str = str.toLowerCase();
        }
        return str.charAt(0).toUpperCase() + str.substr(1);
    },
    spaceToCamel(str) {
        return str
            .replace(/\s(.)/g, char => char.toUpperCase())
            .replace(/\s/, "");
    },
    camelToSpace(str) {
        return str
            .replace(/[A-Z]/g, char => " " + char.toLowerCase())
    }
}