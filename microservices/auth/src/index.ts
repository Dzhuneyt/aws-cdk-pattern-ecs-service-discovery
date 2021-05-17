import {Request, Response} from "express";
import axios, {AxiosResponse} from 'axios';

const express = require('express');
const app = express();
const PORT = 80;

app.get('/login', (req: Request, res: Response) => {
    axios.get(`http://token.myapp/token`, {
        params: {
            username: "something",
            password: "secret",
        },
    }).then((value: AxiosResponse<any>) => {
        console.log(value.data);
        res.json({
            success: true,
            accessToken: value.data,
        })
        res.send('Success');
    }).catch((reason: any) => {
        console.error(reason);
        res
            .json({
                success: false,
            })
            .sendStatus(400);
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
