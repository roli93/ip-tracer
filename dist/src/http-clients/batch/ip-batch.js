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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpBatch = void 0;
const remove_1 = __importDefault(require("lodash/remove"));
const ip_api_client_1 = require("@/http-clients/ip-api-client");
const Process = __importStar(require("process"));
const MAX_BATCH_SIZE = parseInt(Process.env.MAX_BATCH_SIZE || "100");
const MIN_BATCH_WINDOW_MS = parseInt(Process.env.MIN_BATCH_WINDOW_MS || "4000");
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
