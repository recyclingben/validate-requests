const OBJECT_TYPE = {
    ACTION: 1,
    VALIDATOR: 2
};

class ValidationAction {
    constructor(fn, objectType) {
        this._fn = fn;
        this.objectType = objectType;
    }

    run(value, data) {
        if (this.objectType === OBJECT_TYPE.VALIDATOR) {
            return this._fn(value, data);
        }
        this._fn(value, data);
    }
}
exports.OBJECT_TYPE = OBJECT_TYPE;
exports.default = exports.ValidationAction = ValidationAction;