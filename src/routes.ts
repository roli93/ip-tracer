import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import * as iPservice from './ip-service';
import mongoose from 'mongoose';
import {getFarthestCountry, getMostTracedCountry} from "./ip-service";

dotenv.config();

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb+srv://iptracer:zhdPXTVsBmuxLX5M@playgroundcluster.jmsy7ro.mongodb.net/?retryWrites=true&w=majority');
}

const app: Express = express();

app.use(bodyParser.json())

app.post('/traces', async (req: Request, res: Response) => {
    const ip = req.body.ip;
    const trace = await iPservice.traceIp(ip)
    res.send(trace);
});

app.get('/statistics', async (req: Request, res: Response) => {
    const stats = {
        longest_distance: await getFarthestCountry(),
        most_traced: await getMostTracedCountry()
    }
    res.send(stats);
});


export default app