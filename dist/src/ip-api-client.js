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
exports.loadIpBatch = exports.getIpData = void 0;
const axios_1 = __importDefault(require("axios"));
const last_1 = __importDefault(require("lodash/last"));
const ip_batch_1 = require("@/ip-batch");
const httpClient = axios_1.default.create({
    baseURL: 'http://ip-api.com/',
});
const INITIAL_SIMPLE_REQUESTS = 60;
const queue = [];
let simpleRequestsLeft = INITIAL_SIMPLE_REQUESTS;
const getIpData = (ip) => __awaiter(void 0, void 0, void 0, function* () {
    if (simpleRequestsLeft && simpleRequestsLeft > 0) {
        const response = yield httpClient.get(`json/${ip}?fields=57539`);
        simpleRequestsLeft = parseInt(response.headers['x-rl']);
        if (simpleRequestsLeft === 0) {
            const simpleRequestsSecondsToReset = parseInt(response.headers['x-ttl']);
            setTimeout(() => {
                simpleRequestsLeft = INITIAL_SIMPLE_REQUESTS;
            }, simpleRequestsSecondsToReset * 1000);
        }
        return response.data;
    }
    else {
        const ipsResult = yield queueIp(ip);
        return ipsResult.find((r) => r.query === ip);
    }
});
exports.getIpData = getIpData;
const queueIp = (ip) => {
    const currentBatch = (0, last_1.default)(queue);
    if (currentBatch && !currentBatch.isFull()) {
        currentBatch.addIp(ip);
        return currentBatch.resultPromise;
    }
    else {
        const newBatch = new ip_batch_1.IpBatch([ip], queue);
        queue.push(newBatch);
        return newBatch.resultPromise;
    }
};
const loadIpBatch = (ips) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield httpClient.post(`batch?fields=61439`, ips);
    return response.data;
});
exports.loadIpBatch = loadIpBatch;
