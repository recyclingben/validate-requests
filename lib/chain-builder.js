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
            bail: true
        });

        this._chain = new ValidationChain(requestLocation, requestField, this._opts);
        this._run = this._run.bind(this);
    }

    /**
     * Adds error message to previous validation chain link.
     * 
     * @chainable
     * @returns {ChainBuilder} - This
     */
    error(msg) {
        this._chain.addError(msg);
        return this;
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
    isExistant() {
        this._validator((value) => {
            const valid = typeof value === "string";
            return [valid, "existant"];
        });
        return this;
    }

    /**
     * Adds check for value containing something.
     * 
     * @chainable
     * @returns {ChainBuilder} - This
     */
    isContaining(str) {
        const expected = `containing ${str}`;
        this._validator((value) =>
            [validate(value, validator.contains, str), expected]
        );
        return this;
    }

    /**
     * Adds check for boolean to chain. Passes w/ 1, 2, true, and false.
     * 
     * @chainable
     * @returns {ChainBuilder} - This
     */
    isBoolean() {
        const expected = "boolean";
        this._validator((value) =>
            [validate(value, validator.isBoolean), expected]
        );
        return this;
    }

    /**
     * Adds check for float to chain.
     * 
     * @chainable
     * @returns {ChainBuilder} - This
     */
    isFloat() {
        const expected = "float";
        this._validator((value) =>
            [validate(value, validator.isFloat), expected]
        );
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
        this._validator((value) => {
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
    _validator(fn) {
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


    /**
     * Registers a custom validator
     * 
     * @param {string} what - Expectation of validator
     * @param {Function} fn - Validator
     */
    static registerIs(what, fn) {
        this.prototype["is" + utils.case.capitalize(what, false)] =
            this._friendly(fn, utils.case.camelToSpace(what));
    }

    /**
     * Removes common boilerplate from creating a validator and returns a function allowing you to utilize it.
     * 
     * @param {Function} fn Function to friendlify
     * @param {string} expected Expectation of validtor
     */
    static _friendly(fn, expected) {
        return function (...args) {
            this._validator((value, opts) => {
                const { valid, message } = fn(value, opts, ...args);
                return [valid, expected, message];
            });
            return this;
        }
    }
}
module.exports = utils.callable(ChainBuilder, "_run");


function validate(str, fn, ...args) {
    if (typeof str === "undefined") {
        return false;
    }
    return fn(str, ...args);
}