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
    async run(context, req, res, next) {
        if (typeof req.___validationErrors === "undefined") {
            req.___validationErrors = [];
        } else if (req.___validationErrors.length && this._opts.bail) {
            return;
        }
        if (typeof context.req === "undefined") {
            context.req = req;
        }

        for (const link of this._links) {
            context.globalOptionsFocus = false;

            /* If it's an action, no need to check for any returns. */
            if (link.objectType === OBJECT_TYPE.ACTION) {
                await this._runAction(context, link, req, res, next);
                continue;
            }
            else if (link.objectType === OBJECT_TYPE.MODIFIER) {
                await this._runModifier(context, link, req, res, next);
                continue;
            }

            const valid = await this._runValidator(context, link, req, res, next);
            if (!valid && this._opts.bail) {
                break;
            }
        }
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
    async _runValidator(context, link, req, res, next) {
        const fieldValue = req[this._requestLocation][this._requestField];

        let [valid, expected] = await link.run(fieldValue, { context: context, req: req });

        valid = context.negated ? !valid : valid;
        expected = context.negated ? `not ${expected}` : expected;
        let error;
        if (typeof link.error !== "undefined") {
            error = link.error;
        } else {
            error =
                typeof context.error !== "undefined"
                    ? context.error
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
        context.negated = false;
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
    async _runAction(context, link, req, res, next) {
        const fieldValue = req[this._requestLocation][this._requestField];
        await link.run(fieldValue, { context: context, req: req });
    }

    /**
     * Runs a modifier.
     * 
     * @param {ValidationObject} link Modifier link to run
     * @param {Object} req Express request object
     * @param {Object} res Express result object
     * @param {Function} next In case of need to call next middleware line
     */
    async _runModifier(context, link, req, res, next) {
        const fieldValue = req[this._requestLocation][this._requestField];
        await link.run(fieldValue, { context: context, req: req });
    }
}
module.exports = ValidationChain;