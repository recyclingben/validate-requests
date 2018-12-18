"use strict"

/**
 * Provides initial ChainBuilder creation API.
 * 
 * @module lib/validate-requests
 */

const ChainBuilder = require("./chain-builder");

/**
 * Builds ValidateRequests object.
 * 
 * @class
 * @classdesc Exposes ChainBuilder API.
 */
class ValidateRequests {
    /**
     * Returns object with exposed API.
     * 
     * @param {Object} opts - Options to be passed to ChainBuilder
     * @returns {Object} - 
     */
    validator(opts) {
        return {
            query: ChainBuilderBuilderBuilder("query", opts)
        };
    }

    /**
     * Grabs results from express request object.
     * 
     * @returns {Object} - Validation errors
     */
    results(req) {
        return req.___validationErrors;
    }

    /**
     * Exposes ability to register custom validators, actions, etc.
     * 
     * @returns {Object} - Custom functions to use to register
     */
    get register() {
        // TODO custom actions
        return { is: is }
        function is(what, fn) {
            ChainBuilder.registerIs(what, fn);
        }
    }
}
module.exports = (new ValidateRequests());

/**
 *  Builds function that builds ChainBuilders. 
 * 
 * @param {string} requestLocation - Where to grab field from; i.e. "query" or "cookies"
 * @param {Object} opts - Options to be passed into ChainBuilder
 */
function ChainBuilderBuilderBuilder(requestLocation, opts) {
    return field => new ChainBuilder(requestLocation, field, opts);
}