import axios from 'axios';
import currencies from 'currencies.json'
const FIXER_API_KEY = "xIWbbNF3uTKz3T6U43eP20MUW58yUCPQ"

export const traceIp = async (ip: string) => {
    const ipData: any = (await getIpData(ip)).data
    return {
        ip,
        name: ipData.country,
        code: ipData.countryCode,
        lat: ipData.lat,
        lon: ipData.lon,
        currencies: getCurrencies(ipData.countryCode),
        distance_to_usa: getDistanceToUSA(ipData.country)
    }
}

export const getIpData = (ip: string) => axios.get(`http://ip-api.com/json/${ip}?fields=57539`)

const getCurrencies = (countryCode: string) => {
    return currencies
}

const getDistanceToUSA = (country: string) => {
    return 1000
}