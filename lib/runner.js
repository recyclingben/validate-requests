class Runner {
    constructor(validationChain) {
        this.validationChain = validationChain;
        this.context = this._createContext();
    }

    async run(req, res, next) {
        await this.validationChain.run(this.context, req, res, next);
    }

    _createContext() {
        return {
            negated: false,
            message: undefined,
            req: undefined,
            locals: {}
        };
    }
}

module.exports = Runner;