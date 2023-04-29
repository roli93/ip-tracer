import axios, {AxiosResponse} from 'axios';
import {DateTime} from "luxon";
import Process from "process";

const FIXER_API_KEY = Process.env.FIXER_API_KEY
const FIXER_CACHE_VALIDITY_HOURS = parseInt(Process.env.FIXER_CACHE_VALIDITY_HOURS || "96")

const httpClient = axios.create({
    baseURL: Process.env.FIXER_URL,
    headers: {'apikey': FIXER_API_KEY}
});

let cachedRates: {
    ratesResponse: Promise<AxiosResponse>,
    expiration: DateTime
};

const expired = (expiration: DateTime) => expiration.plus({hours: FIXER_CACHE_VALIDITY_HOURS}) < DateTime.now()

const getLatestRates = () => {
    if (!cachedRates || expired(cachedRates.expiration)) {
        cachedRates = {
            ratesResponse: httpClient.get(`latest?base=USD`),
            expiration: DateTime.now()
        }
    }
    return cachedRates.ratesResponse;
}

export const getConversionRateToUSD = async (currencyCode: string) => {
    const latestRates = (await getLatestRates()).data
    return latestRates.rates[currencyCode]
}