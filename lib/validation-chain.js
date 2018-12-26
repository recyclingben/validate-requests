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
        this.context = ValidationChain._createContext();
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
    async run(req, res, next) {
        if (typeof this.context.req === "undefined") {
            this.context.req = req;
        }
        if (typeof req.___validationErrors === "undefined") {
            req.___validationErrors = [];
        }

        for (const link of this._links) {
            this.context.globalOptionsFocus = false;

            /* If it's an action, no need to check for any returns. */
            if (link.objectType === OBJECT_TYPE.ACTION) {
                await this._runAction(link, req, res, next);
                continue;
            }
            else if (link.objectType === OBJECT_TYPE.MODIFIER) {
                await this._runModifier(link, req, res, next);
                continue;
            }

            const valid = await this._runValidator(link, req, res, next);
            if (this._opts.bail && !valid) {
                break;
            }
        }
        this._reset();
        return this;
    }

    /**
     * Runs a validator and places result in request object.
     * 
     * @param {ValidationObject} link - Validator link to run
     * @param {Object} req - Express request object
     * @param {Object} res - Express result object
     * @param {Function} next - In case of need to call next middleware line
     * @returns {boolean} - The validation result
     */
    async _runValidator(link, req, res, next) {
        const fieldValue = req[this._requestLocation][this._requestField];

        let [valid, expected] = await link.run(fieldValue, { context: this.context, req: req });

        valid = this.context.negated ? !valid : valid;
        expected = this.context.negated ? `not ${expected}` : expected;
        let error;
        if (typeof link.error !== "undefined") {
            error = link.error;
        } else {
            error =
                typeof this.context.error !== "undefined"
                    ? this.context.error
                    : "invalid value";
        }

        if (!valid) {
            req.___validationErrors.push({
                error: error,
                location: this._requestLocation,
                field: this._requestField,
                expected: expected,
                got: typeof fieldValue !== "undefined" ? fieldValue : "undefined"
            });
        }
        this.context.negated = false;
        return valid;
    }

    /**
     * Runs an action.
     * 
     * @param {ValidationObject} link Action link to run
     * @param {Object} req Express request object
     * @param {Object} res Express result object
     * @param {Function} next In case of need to call next middleware line
     */
    async _runAction(link, req, res, next) {
        const fieldValue = req[this._requestLocation][this._requestField];
        await link.run(fieldValue, { context: this.context, req: req });
    }

    /**
     * Runs a modifier.
     * 
     * @param {ValidationObject} link Modifier link to run
     * @param {Object} req Express request object
     * @param {Object} res Express result object
     * @param {Function} next In case of need to call next middleware line
     */
    async _runModifier(link, req, res, next) {
        const fieldValue = req[this._requestLocation][this._requestField];
        await link.run(fieldValue, { context: this.context, req: req });
    }

    /**
     * Resets context, etc. for when a new validation must be run.
     */
    _reset() {
        this.context.negated = false;
    }

    /**
     * Default context values for before running.
     * @returns {Object} - Default context values
     */
    static _createContext() {
        return {
            negated: false,
            message: undefined,
            req: undefined
        };
    }
}
module.exports = ValidationChain;