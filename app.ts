import 'module-alias/register';
import 'source-map-support/register';
import app from '@/routes'
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT;

app.listen(port || 8080, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});