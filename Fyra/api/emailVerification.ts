/// file: emailVerfication.ts 
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Verify a user's email address. 
/// Reference: https://www.geeksforgeeks.org/node-js/how-to-send-email-using-node-js/

import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';

const app = express();
const PORT: number = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

app.get('/', (req: Request, res: Response) => {
    res.render('home');
});

app.post('/send-email', async (req: Request, res: Response) => {
    const { recipient, subject, message }: {
        recipient: string;
        subject: string;
        message: string;
    } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER!,
            pass: process.env.EMAIL_PASS!
        }
    });

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipient,
            subject,
            text: message,
        });

        res.send('Email sent successfully!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error in sending email.');
    }
});

app.listen(PORT, () => {
    console.log("App is running on port", {PORT});
});