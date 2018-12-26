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
    VALIDATOR: 2,
    /** Object type that performs changes to request values. */
    MODIFIER: 3
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
    constructor(fn, objectType, error) {
        this._fn = fn;
        this.objectType = objectType;
        this.error = error;
    }

    /**
     * 
     * @param {string} value - Parameter request value
     * @param {Object} data - Any data the validation chain may pass in, including context
     */
    async run(value, data) {
        switch (this.objectType) {
            /* Using scope block to scope cases. */
            case OBJECT_TYPE.VALIDATOR: {
                let result = this._fn(value, data);
                if (result instanceof Promise) {
                    result = await result;
                }
                return result;
            }

            case OBJECT_TYPE.MODIFIER: {
                /* No need to return result; just need to await it if it is asynchronous. */
                let result = this._fn(value, data)
                if (result instanceof Promise) {
                    await result;
                }
                break;
            }

            case OBJECT_TYPE.ACTION:
            default: {
                this._fn(value, data);
            }
        }
    }
}
exports.OBJECT_TYPE = OBJECT_TYPE;
exports.default = exports.ValidationObject = ValidationObject;