"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpBatch = void 0;
const remove_1 = __importDefault(require("lodash/remove"));
const ip_api_client_1 = require("@/ip-api-client");
const MAX_BATCH_SIZE = 2;
const MIN_BATCH_WINDOW_MS = 4000;
class IpBatch {
    constructor(ips, queue) {
        this.ips = ips;
        this.resolved = false;
        this.windowElapsedPromise = this.makeWindowPromise();
        this.batchFullPromise = this.makeFullPromise();
        this.resultPromise = Promise.race([this.windowElapsedPromise, this.batchFullPromise]);
        this.queue = queue;
    }
    isFull() {
        return this.ips.length === MAX_BATCH_SIZE;
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
                    (0, ip_api_client_1.loadIpBatch)(this.ips).then(res).catch(rej).finally(this.resolve.bind(this));
                }
            }, MIN_BATCH_WINDOW_MS);
        });
    }
    makeFullPromise() {
        return new Promise((res, rej) => {
            this.onFull = () => {
                if (!this.resolved) {
                    (0, ip_api_client_1.loadIpBatch)(this.ips).then(res).catch(rej).finally(this.resolve.bind(this));
                }
            };
        });
    }
    resolve() {
        this.resolved = true;
        (0, remove_1.default)(this.queue, b => b === this);
    }
}
exports.IpBatch = IpBatch;
