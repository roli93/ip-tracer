"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceIp = void 0;
const currencies_json_1 = __importDefault(require("../statics/currencies.json"));
const countries_geo_json_1 = __importDefault(require("../statics/countries-geo.json"));
const pick_1 = __importDefault(require("lodash/pick"));
const omit_1 = __importDefault(require("lodash/omit"));
const schemas_1 = require("@/schemas");
const mongoose_1 = require("mongoose");
const ipApiClient = __importStar(require("@/http-clients/ip-api-client"));
const fixerClient = __importStar(require("@/http-clients/fixer-client"));
const traceIp = (ip) => __awaiter(void 0, void 0, void 0, function* () {
    const ipData = yield ipApiClient.getIpData(ip);
    const trace = new schemas_1.Trace({
        ip,
        name: ipData.country,
        code: ipData.countryCode,
        lat: ipData.lat,
        lon: ipData.lon,
        currencies: yield getCurrencies(ipData.countryCode),
        distance_to_usa: getDistanceToUSA(ipData.countryCode)
    });
    yield trace.save();
    retryTimes(5)(() => updateStats(trace));
    return (0, omit_1.default)(trace, ['_id', '__v']);
});
exports.traceIp = traceIp;
const getCurrencies = (countryCode) => {
    return Promise.all(currencies_json_1.default[countryCode].currencies.map((c) => __awaiter(void 0, void 0, void 0, function* () {
        return (Object.assign(Object.assign({}, (0, pick_1.default)(c, ['iso', 'symbol'])), { conversion_rate: yield fixerClient.getConversionRateToUSD(c.iso) }));
    })));
};
const getDistanceToUSA = (countryCode) => {
    const countryGeoData = countries_geo_json_1.default[countryCode];
    const usGeoData = countries_geo_json_1.default["US"];
    return getDistanceFromLatLonInKm(usGeoData.latitude, usGeoData.longitude, countryGeoData.latitude, countryGeoData.longitude);
};
//Taken from https://ip-api.com/docs/api:json
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    let R = 6371; // Radius of the earth in km
    let dLat = deg2rad(lat2 - lat1); // deg2rad below
    let dLon = deg2rad(lon2 - lon1);
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Distance in km
    return R * c;
};
const deg2rad = (deg) => deg * (Math.PI / 180);
const updateStats = (trace) => __awaiter(void 0, void 0, void 0, function* () {
    yield schemas_1.Country.updateOne({ name: trace.name }, { '$inc': { traces: 1 }, '$set': { distance: trace.distance_to_usa } }, { upsert: true });
});
const retryTimes = (times) => (operation) => {
    try {
        if (times > 0) {
            return operation();
        }
    }
    catch (e) {
        if (e instanceof mongoose_1.Error.VersionError) {
            retryTimes(times - 1)(operation);
        }
    }
};
