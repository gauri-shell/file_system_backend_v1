import { MongoClient } from "mongodb";

export const client=new MongoClient("mongodb://127.0.0.1:27017/storageApp")  // when we do only :27017 then by default our database will be test db  so if we mention database name after port then that will be selected as a database 

export async function connectDB(){
    try{
    await client.connect();
    const db=client.db();
    console.log("db connected successfully ");
    return db;
    }catch(err){
        console.log("fail to connect db ")
        await client.close();
        console.log("client Disconnected !")
    }
}

// if we do ctrl + c to shutdown server gracefully 
process.on("SIGINT",async()=>{
    await client.close();
    process.exit(0);
})

