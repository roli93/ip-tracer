import axios from 'axios';
import currencies from './currencies.json'
import countriesGeo from './countries-geo.json'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import {Country, ITrace, Trace} from "@/schemas";
import {Error} from 'mongoose';

type CountryCode = keyof typeof currencies & keyof typeof countriesGeo;

const FIXER_API_KEY = "xIWbbNF3uTKz3T6U43eP20MUW58yUCPQ"

const fixerClient = axios.create({
    baseURL: 'https://api.apilayer.com/fixer/',
    headers: {'apikey': FIXER_API_KEY}
});


export const traceIp = async (ip: string) => {
    const ipData: any = (await getIpData(ip)).data
    const trace = new Trace({
        ip,
        name: ipData.country,
        code: ipData.countryCode,
        lat: ipData.lat,
        lon: ipData.lon,
        currencies: await getCurrencies(ipData.countryCode),
        distance_to_usa: getDistanceToUSA(ipData.countryCode)
    })
    await trace.save()
    retryTimes(5)(() => updateStats(trace))
    return omit(trace, ['_id', '__v']);
}

export const getIpData = (ip: string) => axios.get(`http://ip-api.com/json/${ip}?fields=57539`)

const getCurrencies = (countryCode: CountryCode) => {
    return Promise.all(currencies[countryCode].currencies.map(async c => ({
        ...pick(c, ['iso', 'symbol']),
        conversion_rate: await getConversionRateToUSD(c.iso)
    })))
}

const cachedrates = {
    "success": true,
    "timestamp": 1682626023,
    "base": "USD",
    "date": "2023-04-27",
    "rates": {
        "AED": 3.672399,
        "AFN": 86.504591,
        "ALL": 100.950186,
        "AMD": 386.430099,
        "ANG": 1.802075,
        "AOA": 509.501088,
        "ARS": 222.018024,
        "AUD": 1.508307,
        "AWG": 1.8025,
        "AZN": 1.697801,
        "BAM": 1.770724,
        "BBD": 2.018922,
        "BDT": 106.145656,
        "BGN": 1.774267,
        "BHD": 0.37702,
        "BIF": 2086,
        "BMD": 1,
        "BND": 1.335669,
        "BOB": 6.909539,
        "BRL": 4.979803,
        "BSD": 0.999955,
        "BTC": 3.3716081e-05,
        "BTN": 81.759253,
        "BWP": 13.174477,
        "BYN": 2.523992,
        "BYR": 19600,
        "BZD": 2.015554,
        "CAD": 1.359345,
        "CDF": 2134.999943,
        "CHF": 0.894042,
        "CLF": 0.029092,
        "CLP": 802.750169,
        "CNY": 6.9238,
        "COP": 4657.01,
        "CRC": 533.990032,
        "CUC": 1,
        "CUP": 26.5,
        "CVE": 100.37498,
        "CZK": 21.288599,
        "DJF": 177.719547,
        "DKK": 6.76067,
        "DOP": 54.550444,
        "DZD": 135.430992,
        "EGP": 30.902798,
        "ERN": 15,
        "ETB": 54.140125,
        "EUR": 0.90695,
        "FJD": 2.220299,
        "FKP": 0.801068,
        "GBP": 0.800505,
        "GEL": 2.504991,
        "GGP": 0.801068,
        "GHS": 11.764817,
        "GIP": 0.801068,
        "GMD": 60.050281,
        "GNF": 8605.000145,
        "GTQ": 7.804012,
        "GYD": 211.486927,
        "HKD": 7.849755,
        "HNL": 24.630171,
        "HRK": 6.816133,
        "HTG": 154.492449,
        "HUF": 338.319988,
        "IDR": 14687.9,
        "ILS": 3.63665,
        "IMP": 0.801068,
        "INR": 81.743798,
        "IQD": 1460,
        "IRR": 42275.000105,
        "ISK": 135.269883,
        "JEP": 0.801068,
        "JMD": 153.121181,
        "JOD": 0.709402,
        "JPY": 133.919502,
        "KES": 135.899248,
        "KGS": 87.51971,
        "KHR": 4120.000025,
        "KMF": 446.749912,
        "KPW": 899.96064,
        "KRW": 1340.970205,
        "KWD": 0.30612,
        "KYD": 0.833273,
        "KZT": 456.18006,
        "LAK": 17324.999577,
        "LBP": 15150.000005,
        "LKR": 322.013182,
        "LRD": 164.925005,
        "LSL": 18.300451,
        "LTL": 2.95274,
        "LVL": 0.60489,
        "LYD": 4.764969,
        "MAD": 10.060501,
        "MDL": 17.973673,
        "MGA": 4416.000318,
        "MKD": 55.808161,
        "MMK": 2099.840661,
        "MNT": 3496.107461,
        "MOP": 8.085029,
        "MRO": 356.999828,
        "MUR": 44.849767,
        "MVR": 15.350038,
        "MWK": 1026.000084,
        "MXN": 18.045299,
        "MYR": 4.462993,
        "MZN": 63.249844,
        "NAD": 18.287821,
        "NGN": 461.505683,
        "NIO": 36.549752,
        "NOK": 10.61554,
        "NPR": 130.814985,
        "NZD": 1.62743,
        "OMR": 0.384482,
        "PAB": 0.999946,
        "PEN": 3.722499,
        "PGK": 3.520053,
        "PHP": 55.610502,
        "PKR": 283.725026,
        "PLN": 4.150612,
        "PYG": 7268.957775,
        "QAR": 3.641033,
        "RON": 4.478905,
        "RSD": 106.319784,
        "RUB": 81.625013,
        "RWF": 1114,
        "SAR": 3.750771,
        "SBD": 8.334636,
        "SCR": 13.784991,
        "SDG": 599.503045,
        "SEK": 10.289902,
        "SGD": 1.334901,
        "SHP": 1.21675,
        "SLE": 22.687606,
        "SLL": 19749.999769,
        "SOS": 569.496346,
        "SRD": 37.30203,
        "STD": 20697.981008,
        "SVC": 8.749502,
        "SYP": 2512.453843,
        "SZL": 18.296955,
        "THB": 34.102763,
        "TJS": 10.929148,
        "TMT": 3.51,
        "TND": 3.040115,
        "TOP": 2.36785,
        "TRY": 19.438701,
        "TTD": 6.795466,
        "TWD": 30.714988,
        "TZS": 2350.50065,
        "UAH": 36.926378,
        "UGX": 3759.098975,
        "USD": 1,
        "UYU": 38.731757,
        "UZS": 11412.498015,
        "VEF": 3422230.762389,
        "VES": 24.701223,
        "VND": 23455,
        "VUV": 119.511519,
        "WST": 2.735786,
        "XAF": 593.920464,
        "XAG": 0.040114,
        "XAU": 0.000503,
        "XCD": 2.70255,
        "XDR": 0.740955,
        "XOF": 594.501191,
        "XPF": 108.625017,
        "YER": 250.401083,
        "ZAR": 18.29055,
        "ZMK": 9001.20436,
        "ZMW": 17.763634,
        "ZWL": 321.999592
    }
}

const getConversionRateToUSD = async (currencyCode: string) => {
    const latestRates = cachedrates //(await fixerClient.get(`latest?base=USD`)).data
    // @ts-ignore
    return latestRates.rates[currencyCode]
}

const getDistanceToUSA = (countryCode: CountryCode) => {
    const countryGeoData = countriesGeo[countryCode]
    const usGeoData = countriesGeo["US" as CountryCode]
    return getDistanceFromLatLonInKm(usGeoData.latitude, usGeoData.longitude, countryGeoData.latitude, countryGeoData.longitude)
}

//Taken from https://ip-api.com/docs/api:json
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    let R = 6371; // Radius of the earth in km
    let dLat = deg2rad(lat2 - lat1);  // deg2rad below
    let dLon = deg2rad(lon2 - lon1);
    let a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Distance in km
    return R * c;
}

const deg2rad = (deg: number) => deg * (Math.PI / 180)

const updateStats =  async (trace: ITrace) => {
    await Country.updateOne(
        {name: trace.name},
        {'$inc': {traces: 1}, '$set':{distance: trace.distance_to_usa}},
        {upsert: true}
    )
}

const retryTimes = (times: number) => (operation: () => any) => {
    try{
        if(times > 0){
            return operation()
        }
    } catch(e){
        if(e instanceof Error.VersionError){
            retryTimes(times -1)(operation)
        }
    }
}

export const getFarthestCountry = async () => {
    const farthestCountry = (await Country.aggregate().sort({distance:1}).limit(1).exec())[0]
    return {
        country: farthestCountry.name,
        value: farthestCountry.distance
    }
}

export const getMostTracedCountry = async () => {
    const mostTracedCoountry = (await Country.aggregate().sort({traces:1}).limit(1).exec())[0]
    return {
        country: mostTracedCoountry.name,
        value: mostTracedCoountry.traces
    }
}
