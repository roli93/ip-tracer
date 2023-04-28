import axios from 'axios';

const httpClient = axios.create({
    baseURL: 'http://ip-api.com/json/',
});

export const getIpData = async (ip: string) => {
    const response = await httpClient.get(`${ip}?fields=57539`)
    return response.data
}
