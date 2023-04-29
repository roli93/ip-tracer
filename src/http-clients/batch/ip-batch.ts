import remove from "lodash/remove";
import {loadIpBatch} from "@/http-clients/ip-api-client";
import * as Process from "process";

const MAX_BATCH_SIZE = parseInt(Process.env.MAX_BATCH_SIZE || "100");
const MIN_BATCH_WINDOW_MS = parseInt(Process.env.MIN_BATCH_WINDOW_MS || "4000");

export class IpBatch {
    ips: string[];
    resolved: boolean;
    resultPromise: Promise<any>;
    private windowElapsedPromise: Promise<any>;
    private batchFullPromise: Promise<any>;
    private onFull?: () => any;
    private queue: IpBatch[];


    constructor(ips: string[], queue: IpBatch[]) {
        this.ips = ips;
        this.resolved = false;
        this.windowElapsedPromise = this.makeWindowPromise()
        this.batchFullPromise = this.makeFullPromise()
        this.resultPromise = Promise.race([this.windowElapsedPromise, this.batchFullPromise])
        this.queue = queue
    }

    isFull(){
        return this.ips.length === MAX_BATCH_SIZE;
    }

    addIp(ip: string){
        this.ips.push(ip);
        if(this.isFull()){
            this.onFull && this.onFull()
        }
    }

    makeWindowPromise(){
        return new Promise((res, rej) =>{
            setTimeout(() => {
                if(!this.resolved){
                    loadIpBatch(this.ips).then(res).catch(rej).finally(this.resolve.bind(this))
                }
            },MIN_BATCH_WINDOW_MS)
        })
    }

    makeFullPromise(){
        return new Promise((res, rej) =>{
            this.onFull = () => {
                if(!this.resolved){
                    loadIpBatch(this.ips).then(res).catch(rej).finally(this.resolve.bind(this))
                }
            }
        })
    }

    resolve(){
        this.resolved = true;
        remove(this.queue, b => b === this)
    }

}