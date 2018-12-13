"use strict"

const OBJECT_TYPE = require("./validation-object").OBJECT_TYPE;

class ValidationChain {
    constructor(requestLocation, requestField, opts) {
        this._links = [];
        this._requestLocation = requestLocation;
        this._requestField = requestField;
        this._opts = opts;

        this._reset();
    }

    addLink(validationObject) {
        this._links.push(validationObject);
        return this;
    }

    run(req, res, next) {
        if (typeof req.___validationErrors === "undefined") {
            req.___validationErrors = [];
        }

        for (const link of this._links) {
            const fieldValue = req[this._requestLocation][this._requestField];
            if (link.objectType === OBJECT_TYPE.ACTION) {
                link.run(fieldValue, { context: this.context });
                continue;
            }

            let [valid, expected, message] = link.run(fieldValue, { context: this.context });
            valid = this.context.negated ? !valid : valid;
            expected = this.context.negated ? `not ${expected}` : expected;

            if (!valid) {
                req.___validationErrors.push({
                    error: message ? message : ("invalid value"),
                    location: this._requestLocation,
                    field: this._requestField,
                    expected: expected,
                })
                if (this._opts.bail) {
                    return;
                }
            }
            this.context.negated = false;
        }
        this._reset();
    }

    _reset() {
        this.context = createContext();
    }
}
module.exports = ValidationChain;

function createContext() {
    return {
        negated: false
    };
}