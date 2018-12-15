"use strict"

/**
 * Provides initial ChainBuilder creation API.
 * 
 * @module lib/validate-requests
 */

const ChainBuilder = require("./chain-builder");


/**
 *  Builds function that builds ChainBuilders. 
 * 
 * @param {string} requestLocation - Where to grab field from; i.e. "query" or "cookies"
 * @param {Object} opts - Options to be passed into ChainBuilder
 */
function ChainBuilderBuilderBuilder(requestLocation, opts) {
    return field => new ChainBuilder(requestLocation, field, opts);
}

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
}
module.exports = (new ValidateRequests());