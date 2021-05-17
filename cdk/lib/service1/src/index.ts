import {Request, Response} from "express";
import axios from 'axios';

const express = require('express');
const app = express();
const PORT = 80;

app.get('/one/:any', (req: Request, res: Response) => {
    res.send('Hello from Microservice 1');
});
app.get('/two/:any', (req: Request, res: Response) => {
    console.log(`http://service-2.myapp${req.path}`);
    axios.get(`http://service-2.myapp${req.path}`).then(value => {
        console.log(value.data);
        res.send('Success');
    }).catch(reason => {
        console.error(reason);
        res.send('Fail');
    });

    // request(`http://service2.myapp/${req.path}`,
    //     function (error: any, response: { statusCode: number; body: any; }, body: string) {
    //         console.log(response)
    //         if (!error && response.statusCode == 200) {
    //             response = JSON.parse(body);
    //             res.send(response);
    //         } else {
    //             console.log(response.statusCode + response.body);
    //             res.send({distance: -1});
    //         }
    //     });
})
app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
