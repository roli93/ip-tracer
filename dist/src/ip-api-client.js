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
const remove_1 = __importDefault(require("lodash/remove"));
const last_1 = __importDefault(require("lodash/last"));
const httpClient = axios_1.default.create({
    baseURL: 'http://ip-api.com/',
});
// export const getIpData = async (ip: string) => {
//     const response = await httpClient.get(`json/${ip}?fields=57539`)
//     return response.data
// }
const getIpData = (ip) => __awaiter(void 0, void 0, void 0, function* () {
    const ipsResult = yield queueIp(ip);
    return ipsResult.find((r) => r.query === ip);
});
exports.getIpData = getIpData;
const queue = [];
class IpBatch {
    constructor(ips) {
        this.ips = ips;
        this.resolved = false;
        this.windowElapsedPromise = this.makeWindowPromise();
        this.batchFullPromise = this.makeFullPromise();
        this.resultPromise = Promise.race([this.windowElapsedPromise, this.batchFullPromise]);
    }
    isFull() {
        return this.ips.length === 2;
    }
    addIp(ip) {
        this.ips.push(ip);
        if (this.isFull()) {
            this.onFull && this.onFull();
        }
    }
    makeWindowPromise() {
        return new Promise((res, rej) => {
            setTimeout(() => {
                if (!this.resolved) {
                    (0, exports.loadIpBatch)(this.ips).then(res).catch(rej).finally(this.resolve.bind(this));
                }
            }, 10000);
        });
    }
    makeFullPromise() {
        return new Promise((res, rej) => {
            this.onFull = () => {
                if (!this.resolved) {
                    (0, exports.loadIpBatch)(this.ips).then(res).catch(rej).finally(this.resolve.bind(this));
                }
            };
        });
    }
    resolve() {
        this.resolved = true;
        (0, remove_1.default)(queue, b => b === this);
    }
}
const queueIp = (ip) => {
    const currentBatch = (0, last_1.default)(queue);
    if (currentBatch && !currentBatch.isFull()) {
        currentBatch.addIp(ip);
        return currentBatch.resultPromise;
    }
    else {
        const newBatch = new IpBatch([ip]);
        queue.push(newBatch);
        return newBatch.resultPromise;
    }
};
const loadIpBatch = (ips) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield httpClient.post(`batch?fields=61439`, ips);
    return response.data;
});
exports.loadIpBatch = loadIpBatch;
