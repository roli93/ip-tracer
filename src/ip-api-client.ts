import axios from 'axios';
import isEmpty from 'lodash/isEmpty'
import remove from 'lodash/remove'
import last from 'lodash/last'

const httpClient = axios.create({
    baseURL: 'http://ip-api.com/',
});

// export const getIpData = async (ip: string) => {
//     const response = await httpClient.get(`json/${ip}?fields=57539`)
//     return response.data
// }

export const getIpData = async (ip: string) => {
    const ipsResult = await queueIp(ip);
    return ipsResult.find((r: { query: string; }) => r.query === ip)
}


const queue: IpBatch[] = [];


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
        return this.ips.length === 2;
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
            },10000)
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
