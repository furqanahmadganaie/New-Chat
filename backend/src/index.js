// top of server.js / index.js
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
// then import mongoose/connect...

import express from 'express';
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';
import cors from 'cors'
import path from "path";
import authRoutes from '../routes/auth.route.js';
import messageRoutes from '../routes/message.route.js'
import { connectDB } from '../lib/db.js';
dotenv.config();
const app=express();

const PORT = process.env.PORT;
// const __dirname = path.resolve();
app.use(express.json()); //middleware  to ectrach the daata 

app.use(cookieParser()); //allows to parese the cookie
//CqCFjIbMLu0g9XdW

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// const PORT =3000;
app.use("/api/auth", authRoutes);
app.use("/api/meaasge",messageRoutes);

app.listen(PORT,()=> {
     console.log(`server running on ${PORT}`)
    connectDB();
});