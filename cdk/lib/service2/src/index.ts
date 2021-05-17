import {Request, Response} from "express";

const express = require('express');
const app = express();
const PORT = 80;

const request = require('request');

app.get('/two/:any', (req: Request, res: Response) => {
    res.send('Hello from Microservice 2');
});

app.get('/one/:any', (req: Request, res: Response) => {
    request(`http://service-1.myapp/${req.path}`,
        function (error: any, response: { statusCode: number; body: any; }, body: string) {
            if (!error && response.statusCode == 200) {
                response = JSON.parse(body);
                res.send(response);
            } else {
                console.log(response.statusCode + response.body);
                res.send({distance: -1});
            }
        });
})

app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
