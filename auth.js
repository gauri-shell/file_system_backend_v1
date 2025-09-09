import { ObjectId } from "mongodb";

export default async function checkAuth(req,res,next){
    const {userId}=req.cookies;
    const db=req.db;

    if(!userId){
        return res.status(401).json({error:"Not login"});
    }

    const user=await db.collection("users").findOne({_id:ObjectId.createFromHexString(userId)})
    if(!user){
        return res.status(401).json({error:"Not login"});
    }
    
    req.user=user;
    next();
}