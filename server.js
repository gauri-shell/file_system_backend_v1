import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

import dir_routes from "./routes/dir_routes.js"
import file_routes from "./routes/file_routes.js";
import user_routes from "./routes/user_routes.js";
import checkAuth from "./auth.js"
import { connectDB } from "./config/db.js";


const db=await connectDB();

const app=express();
app.use(cookieParser());
app.use(cors(
    {
        origin:"http://127.0.0.1:5173",
        credentials:true
    }
));
app.use((req,res,next)=>{
    req.db=db;
    next();
});


// route handler 
app.use("/directory",checkAuth,dir_routes);
app.use("/file",checkAuth,file_routes);
app.use("/user",user_routes);

// global error handler   
app.use((err,req,res,next)=>{
    res.status(500).json({"error":"something went wrong !"});
})


app.listen(4000,()=>{
    console.log("server running on prot 4000")
})  