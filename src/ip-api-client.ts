import axios from 'axios';
import isEmpty from 'lodash/isEmpty'
import remove from 'lodash/remove'
import last from 'lodash/last'

const httpClient = axios.create({
    baseURL: 'http://ip-api.com/',
});

const MAX_BATCH_SIZE = 2;
const MIN_BATCH_WINDOW_MS = 4000;
const INITIAL_SIMPLE_REQUESTS = 60;

const queue: IpBatch[] = [];

let simpleRequestsLeft: number = INITIAL_SIMPLE_REQUESTS;

export const getIpData = async (ip: string) => {
    if(simpleRequestsLeft && simpleRequestsLeft > 0){
        const response = await httpClient.get(`json/${ip}?fields=57539`)
        simpleRequestsLeft = parseInt(response.headers['x-rl']) - 40
        if(simpleRequestsLeft === 0){
            const simpleRequestsSecondsToReset = parseInt(response.headers['x-ttl'])
            setTimeout(() => {
                simpleRequestsLeft = INITIAL_SIMPLE_REQUESTS;
            }, simpleRequestsSecondsToReset * 1000)
        }
        return response.data
    } else {
        const ipsResult = await queueIp(ip);
        return ipsResult.find((r: { query: string; }) => r.query === ip)
    }
}

// export const getIpData = async (ip: string) => {
//     const ipsResult = await queueIp(ip);
//     return ipsResult.find((r: { query: string; }) => r.query === ip)
// }

class IpBatch {
    ips: string[];
    resolved: boolean;
    resultPromise: Promise<any>;
    private windowElapsedPromise: Promise<any>;
    private batchFullPromise: Promise<any>;
    private onFull?: () => any;

    constructor(ips: string[]) {
        this.ips = ips;
        this.resolved = false;
        this.windowElapsedPromise = this.makeWindowPromise()
        this.batchFullPromise = this.makeFullPromise()
        this.resultPromise = Promise.race([this.windowElapsedPromise, this.batchFullPromise])
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
        remove(queue, b => b === this)
    }

}

const queueIp = (ip: string) => {
    const currentBatch = last(queue);
    if(currentBatch && !currentBatch.isFull()){
        currentBatch.addIp(ip)
        return currentBatch.resultPromise;
    } else {
        const newBatch = new IpBatch([ip]);
        queue.push(newBatch)
        return newBatch.resultPromise;
    }
}


export const loadIpBatch = async (ips: string[]) => {
    const response = await httpClient.post(`batch?fields=61439`, ips)
    return response.data
}
