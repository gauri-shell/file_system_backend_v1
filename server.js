import express from "express";
import cors from "cors"

import dir_routes from "./routes/dir_routes.js"
import file_routes from "./routes/file_routes.js"

const app=express();
app.use(cors())

app.use("/directory",dir_routes);
app.use("/files",file_routes);




app.listen(4000,()=>{
    console.log("server running on prot 4000")
})