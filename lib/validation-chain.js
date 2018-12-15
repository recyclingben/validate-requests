"use strict"

/**
 * Provides ValidationChain object.
 * 
 * @module lib/validation-chain
 */

const OBJECT_TYPE = require("./validation-object").OBJECT_TYPE;

/**
 * Creates object of type ValidationChain.
 * 
 * @param {string} requestLocation - Where to grab field from; i.e. "query" or "cookies"
 * @param {Object} requestField - Key of value to look for in request location
 * @param {Object} opts - Options
 * 
 * @class
 * @classdesc Contains and sequentially runs validation objects.
 */
class ValidationChain {
    constructor(requestLocation, requestField, opts) {
        this._links = [];
        this._requestLocation = requestLocation;
        this._requestField = requestField;
        this._opts = opts;
    }

    /**
     * Adds link to run on validation chain.
     * 
     * @param {ValidationObject} validationObject - Object to use to validate / act on context and value
     * @chainable
     * @returns {ValidationChain} - This
     */
    addLink(validationObject) {
        this._links.push(validationObject);
        return this;
    }

    /**
     * Runs validation chain in place.
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express result object
     * @param {Object} next - Used if needed to call next middleware
     * @chainable
     * @returns {ValidationChain} - This
     */
    run(req, res, next) {
        this._reset();

        if (typeof req.___validationErrors === "undefined") {
            req.___validationErrors = [];
        }

        for (const link of this._links) {
            const fieldValue = req[this._requestLocation][this._requestField];
            /* If it's an action, no need to check for any returns. */
            if (link.objectType === OBJECT_TYPE.ACTION) {
                link.run(fieldValue, { context: this.context });
                continue;
            }

            let [valid, expected, message] = link.run(fieldValue, { context: this.context });
            valid = this.context.negated ? !valid : valid;
            expected = this.context.negated ? `not ${expected}` : expected;

            if (!valid) {
                req.___validationErrors.push({
                    error: message ? message : "invalid value",
                    location: this._requestLocation,
                    field: this._requestField,
                    expected: expected,
                })
                if (this._opts.bail) {
                    break;
                }
            }
            this.context.negated = false;
        }
        return this;
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