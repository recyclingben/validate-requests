"use strict"

/**
 * Object to be used within validation chain. Can negate context, validate item, etc.
 * 
 * @module lib/validation-object
 */

/**
 * To be used to identify object type.
 * 
 * @enum {number}
 */
const OBJECT_TYPE = {
    /** Object type that only changes context without performing validation. */
    ACTION: 1,
    /** Object type that performs validation and may change context. */
    VALIDATOR: 2
};

/**
 * Used to create an object of type ValidationAction.
 * 
 * @param {Function} fn - Function to be called
 * @param {enum} objectType - ValidationAction's object type; see OBJECT_TYPE
 * 
 * @class
 * @classdesc Used as a validation chain link. Used to validate requests, alter the chain context, or both.
 */
class ValidationObject {
    constructor(fn, objectType) {
        this._fn = fn;
        this.objectType = objectType;
    }

    /**
     * 
     * @param {string} value - Parameter request value
     * @param {Object} data - Any data the validation chain may pass in, including context
     */
    run(value, data) {
        if (this.objectType === OBJECT_TYPE.VALIDATOR) {
            return this._fn(value, data);
        }
        this._fn(value, data);
    }
}
exports.OBJECT_TYPE = OBJECT_TYPE;
exports.default = exports.ValidationObject = ValidationObject;