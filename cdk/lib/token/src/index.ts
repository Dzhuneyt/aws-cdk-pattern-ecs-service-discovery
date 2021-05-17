import {Request, Response} from "express";

const express = require('express');
const app = express();
const PORT = 80;

app.get('/token', (req: Request, res: Response) => {
    const accessToken = "SOMETHING_RETRIEVED_FROM_DATABASE";

    res.json({
        accessToken,
    });
});

app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
