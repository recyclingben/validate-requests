"use strict"

/**
 * Provides callable ChainBuilder object.
 * 
 * @module lib/chain-builder
 */

const ValidationChain = require("./validation-chain");
const validator = require("validator");

const ValidationObject = require("./validation-object").default;
const OBJECT_TYPE = require("./validation-object").OBJECT_TYPE;

const utils = require("../utils/utils");

/**
 * Creates object of type ChainBuilder. 
 * 
 * @param {string} requestLocation - i.e. "query" or "cookies"; Denotes location of target field
 * @param {string} requestField - Request paremeter key to validate
 * @param {object} [opts] - Options
 * @param {boolean} [opts.bail] - Whether or not to bail on the first error of the chain
 * 
 * @class
 * @classdesc
 * Provides public API to build validation chains.
 */
class ChainBuilder {
    constructor(requestLocation, requestField, opts) {
        this._requestLocation = requestLocation;
        this._requestField = requestField;
        this._opts = utils.defaults(opts, {
            bail: false
        });

        this._chain = new ValidationChain(requestLocation, requestField, this._opts);
        this._run = this._run.bind(this);
    }

    /**
     * Adds action to negate context to chain.
     * 
     * @chainable
     * @returns {ChainBuilder} - This
     */
    not() {
        this._action((value, { context }) => {
            context.negated = true;
        });
        return this;
    }

    /**
     * Adds check for existence to chain.
     * 
     * @chainable
     * @returns {ChainBuilder} - This
     */
    exists() {
        this._validate((value) => {
            const valid = typeof value === "string";
            return [valid, "existant"];
        });
        return this;
    }

    /**
     * Adds check for integer to chain.
     * 
     * @chainable
     * @returns {ChainBuilder} - This
     */
    isInt() {
        const expected = "integer";
        this._validate((value) => {
            const valid =
                typeof value === "undefined"
                    ? false
                    : validator.isInt(value);
            return [valid, expected];
        });
        return this;
    }

    /**
     * Adds validation object to chain with function fn and OBJECT_TYPE VALIDATOR.
     * 
     * @private
     * @param {Function} fn - Function to add to chain
     */
    _validate(fn) {
        const link = new ValidationObject(fn, OBJECT_TYPE.VALIDATOR);
        this._chain.addLink(link);
    }

    /**
     * Adds validation object to chain with function fn and OBJECT_TYPE ACTION.
     * 
     * @private
     * @param {Function} fn - Function to add to chain
     */
    _action(fn) {
        const link = new ValidationObject(fn, OBJECT_TYPE.ACTION);
        this._chain.addLink(link);
    }

    /**
     * Runs the validation chain.
     * 
     * @param {object} req - Express request object
     * @param {object} res - Express result object
     * @param {Function} next - To continue on middleware pipeline
     */
    _run(req, res, next) {
        this._chain.run(req, res, next);
        next();
    }
}

/**
 * @class
 * @classdesc - Creates a ChainBuilder instance that can be directly called. Is a function so that it may return a ChainBuilder yet still be used with the `new` keyword.
 * 
 * @param  {...any} args - ChainBuilder constructor arguments
 */
function CallableChainBuilder(...args) {
    const validationChain = new ChainBuilder(...args);
    return utils.callable(validationChain, validationChain._run);
}
module.exports = CallableChainBuilder;
