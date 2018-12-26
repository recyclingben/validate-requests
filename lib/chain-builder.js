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
        const links = this._chain._links;
        if (!links.length) {
            this._chain.context.error = msg;
        } else {
            links[links.length - 1].error = msg;
        }
        return this;
    }

    /**
     * Adds ability to change request value to validation chain.
     * 
     * @chainable
     * @returns {ChainBuilder} - This
     */
    modify(fn) {
        ChainBuilder._friendlyModifier(fn).bind(this)();
        return this;
    }

    /**
     * Adds ability to change request values or do something when chain reaches validation object.
     * 
     * @chainable
     * @returns {ChainBuilder} - This
     */
    do(fn) {
        this._modifier(async (value, obj) => {
            const result = fn(obj);
            if (result instanceof Promise) {
                await result;
            }
        });
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

    is(what, fn) {
        ChainBuilder._friendlyValidator(what, fn).bind(this)();
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
     * Adds validation object to chain with function fn and OBJECT_TYPE MODIFIER.
     * 
     * @private
     * @param {Function} fn - Function to add to chain
     */
    _modifier(fn) {
        const link = new ValidationObject(fn, OBJECT_TYPE.MODIFIER);
        this._chain.addLink(link);
    }


    /**
     * Runs the validation chain.
     * 
     * @param {object} req - Express request object
     * @param {object} res - Express result object
     * @param {Function} next - To continue on middleware pipeline
     */
    async _run(req, res, next) {
        await this._chain.run(req, res, next);
        next();
    }


    /**
     * Registers a custom validator
     * 
     * @param {string} what - Expectation of validator
     * @param {Function} fn - Validator
     */
    static registerIs(what, fn) {
        const expected =
            utils.case.isCamelCase(what)
                ? utils.case.camelToSpace(what)
                : utils.case.pascalToSpace(what);
        this.prototype["is" + utils.case.capitalize(what, false)] =
            this._friendlyValidator(expected, fn);
    }

    /**
     * Removes common boilerplate from creating a validator and returns a function allowing you to utilize it.
     * 
     * @param {Function} fn Function to friendlify
     * @param {string} expected Expectation of validtor
     */
    static _friendlyValidator(expected, fn) {
        return function (...args) {
            this._validator(async (value, opts) => {
                let result = fn(value, opts, ...args);
                if (result instanceof Promise) {
                    result = await result;
                }
                const { valid, message } = result;
                return [valid, expected, message];
            });
            return this;
        }
    }

    /**
     * Removes common boilerplate from creating a modifier and returns a function allowing you to utilize it.
     * 
     * @param {Function} fn Function to friendlify
     */
    static _friendlyModifier(fn) {
        return function () {
            this._modifier(async (value, data) => {
                let result = fn(value, data);
                if (result instanceof Promise) {
                    result = await result;
                }
                data.req[this._requestLocation][this._requestField] = result;
            });
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