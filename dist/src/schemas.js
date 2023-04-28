"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trace = void 0;
const mongoose_1 = require("mongoose");
// 2. Create a Schema corresponding to the document interface.
const traceSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    currencies: [{
            iso: { type: String, required: true },
            symbol: { type: String, required: true },
            conversion_rate: { type: String, required: true },
        }],
    distance_to_usa: { type: Number, required: true },
});
exports.Trace = (0, mongoose_1.model)('Trace', traceSchema);
