import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import * as iPservice from './services/ip-service';
import mongoose from 'mongoose';
import {getFarthestCountry, getMostTracedCountry} from "./services/stats-service";

dotenv.config();

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb+srv://iptracer:zhdPXTVsBmuxLX5M@playgroundcluster.jmsy7ro.mongodb.net/?retryWrites=true&w=majority');
}

const app: Express = express();

app.use(bodyParser.json())

app.post('/traces', async (req: Request, res: Response) => {
    const ip = req.body.ip;
    try{
        const trace = await iPservice.traceIp(ip)
        res.send(trace)
    } catch (e: any){
        res.status(502).send({error: e.message ? e.message : "Unknown error"})
    }
});

app.get('/statistics', async (req: Request, res: Response) => {
    try{
        const stats = {
            longest_distance: await getFarthestCountry(),
            most_traced: await getMostTracedCountry()
        }
        res.send(stats);
    } catch (e: any){
        res.status(502).send({error: e.message ? e.message : "Unknown error"})
    }
});


export default app