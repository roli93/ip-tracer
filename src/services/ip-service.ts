import axios from 'axios';
import currencies from '../statics/currencies.json'
import countriesGeo from '../statics/countries-geo.json'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import {Country, ITrace, Trace} from "@/schemas";
import {Error} from 'mongoose';
import * as ipApiClient from "@/http-clients/ip-api-client";
import * as fixerClient from "@/http-clients/fixer-client";

type CountryCode = keyof typeof currencies & keyof typeof countriesGeo;

export const traceIp = async (ip: string) => {
    const ipData: any = await ipApiClient.getIpData(ip)
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
    updateStats(trace)
    return omit(trace, ['_id', '__v']);
}

const getCurrencies = (countryCode: CountryCode) => {
    return Promise.all(currencies[countryCode].currencies.map(async c => ({
        ...pick(c, ['iso', 'symbol']),
        conversion_rate: await fixerClient.getConversionRateToUSD(c.iso)
    })))
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




