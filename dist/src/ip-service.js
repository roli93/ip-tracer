"use strict";
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
exports.getIpData = exports.traceIp = void 0;
const axios_1 = __importDefault(require("axios"));
const currencies_json_1 = __importDefault(require("currencies.json"));
const FIXER_API_KEY = "xIWbbNF3uTKz3T6U43eP20MUW58yUCPQ";
const traceIp = (ip) => __awaiter(void 0, void 0, void 0, function* () {
    const ipData = (yield (0, exports.getIpData)(ip)).data;
    return {
        ip,
        name: ipData.country,
        code: ipData.countryCode,
        lat: ipData.lat,
        lon: ipData.lon,
        currencies: getCurrencies(ipData.countryCode),
        distance_to_usa: getDistanceToUSA(ipData.country)
    };
});
exports.traceIp = traceIp;
const getIpData = (ip) => axios_1.default.get(`http://ip-api.com/json/${ip}?fields=57539`);
exports.getIpData = getIpData;
const getCurrencies = (countryCode) => {
    return currencies_json_1.default;
};
const getDistanceToUSA = (country) => {
    return 1000;
};
