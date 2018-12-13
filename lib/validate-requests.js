const ChainBuilder = require("./chain-builder");

/* Builds function that builds ChainBuilders. */
function ChainBuilderBuilderBuilder(requestLocation, opts) {
    return field => new ChainBuilder(requestLocation, field, opts);
}

class ValidateRequests {
    validate(opts) {
        return {
            query: ChainBuilderBuilderBuilder("query", opts)
        };
    }

    results(req) {
        return req.___validationErrors;
    }
}
module.exports = (new ValidateRequests());