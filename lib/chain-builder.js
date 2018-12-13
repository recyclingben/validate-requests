const ValidationChain = require("./validation-chain");
const validator = require("validator");

const ValidationObject = require("./validation-object").default;
const OBJECT_TYPE = require("./validation-object").OBJECT_TYPE;

const utils = require("../utils/utils");

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

    not() {
        this._action((value, { context }) => {
            context.negated = true;
        });
        return this;
    }

    nor() {
        this.not();
        return this;
    }

    exists() {
        this._validate((value) => {
            const valid = typeof value === "string";
            return [valid, "existant"];
        }, false);
        return this;
    }

    /**
     * Adds check for integer to chain
     * 
     * @chainable
     * @returns {ChainBuilder} - This
     */
    isInt(opts) {
        const expected = "integer";
        this._validate((value) => {
            if (typeof value !== "string") {
                return [false, "typeof string"];
            }

            const valid = validator.isInt(value, opts);
            return [valid, expected];
        });
        return this;
    }


    _validate(fn) {
        const link = new ValidationObject(fn, OBJECT_TYPE.VALIDATOR);
        this._chain.addLink(link);
    }

    _action(fn) {
        const link = new ValidationObject(fn, OBJECT_TYPE.ACTION);
        this._chain.addLink(link);
    }

    _run(req, res, next) {
        this._chain.run(req, res, next);
        next();
    }
}

function CallableChainBuilder(...args) {
    const validationChain = new ChainBuilder(...args);
    return utils.callable(validationChain, "_run");
}
module.exports = CallableChainBuilder;
