import {Country} from "@/schemas";

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


