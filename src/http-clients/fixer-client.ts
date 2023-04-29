import axios, {AxiosResponse} from 'axios';
import {DateTime} from "luxon";

const FIXER_API_KEY = "xIWbbNF3uTKz3T6U43eP20MUW58yUCPQ"

const FIXER_CACHE_VALIDITY_HOURS = 96;

const httpClient = axios.create({
    baseURL: 'https://api.apilayer.com/fixer/',
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