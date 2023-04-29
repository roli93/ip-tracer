import axios from 'axios';
import isEmpty from 'lodash/isEmpty'
import remove from 'lodash/remove'
import last from 'lodash/last'
import {IpBatch} from "@/ip-batch";

const httpClient = axios.create({
    baseURL: 'http://ip-api.com/',
});

const INITIAL_SIMPLE_REQUESTS = 60;

const queue: IpBatch[] = [];

let simpleRequestsLeft: number = INITIAL_SIMPLE_REQUESTS;

export const getIpData = async (ip: string) => {
    if(simpleRequestsLeft && simpleRequestsLeft > 0){
        const response = await httpClient.get(`json/${ip}?fields=57539`)
        simpleRequestsLeft = parseInt(response.headers['x-rl'])
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

const queueIp = (ip: string) => {
    const currentBatch = last(queue);
    if(currentBatch && !currentBatch.isFull()){
        currentBatch.addIp(ip)
        return currentBatch.resultPromise;
    } else {
        const newBatch = new IpBatch([ip], queue);
        queue.push(newBatch)
        return newBatch.resultPromise;
    }
}


export const loadIpBatch = async (ips: string[]) => {
    const response = await httpClient.post(`batch?fields=61439`, ips)
    return response.data
}
