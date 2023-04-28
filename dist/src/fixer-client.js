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
exports.getConversionRateToUSD = void 0;
const axios_1 = __importDefault(require("axios"));
const luxon_1 = require("luxon");
const FIXER_API_KEY = "xIWbbNF3uTKz3T6U43eP20MUW58yUCPQ";
const FIXER_CACHE_VALIDITY_HOURS = 96;
const httpClient = axios_1.default.create({
    baseURL: 'https://api.apilayer.com/fixer/',
    headers: { 'apikey': FIXER_API_KEY }
});
let cachedRates;
const expired = (expiration) => expiration.plus({ hours: FIXER_CACHE_VALIDITY_HOURS }) < luxon_1.DateTime.now();
const getLatestRates = () => {
    if (!cachedRates || expired(cachedRates.expiration)) {
        cachedRates = {
            ratesResponse: httpClient.get(`latest?base=USD`),
            expiration: luxon_1.DateTime.now()
        };
    }
    return cachedRates.ratesResponse;
};
const getConversionRateToUSD = (currencyCode) => __awaiter(void 0, void 0, void 0, function* () {
    const latestRates = (yield getLatestRates()).data;
    return latestRates.rates[currencyCode];
});
exports.getConversionRateToUSD = getConversionRateToUSD;
