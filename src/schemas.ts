import { Schema, model } from 'mongoose';

// 1. Create an interface representing a document in MongoDB.
interface ITrace {
    ip: string;
    name: string;
    code: string;
    lat: number;
    lon: number;
    currencies: {
       iso: string;
       symbol: string;
       conversion_rate: number;
    }[]
    distance_to_usa: number;
}

// 2. Create a Schema corresponding to the document interface.
const traceSchema = new Schema<ITrace>({
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

export const Trace = model<ITrace>('Trace', traceSchema);
