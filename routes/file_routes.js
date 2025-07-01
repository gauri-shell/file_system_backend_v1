import express from "express";
import { rm,} from "fs/promises"
import fs from "fs"
import { pipeline } from "stream/promises";
import path, { basename } from "path"

const router=express.Router();
// getting files 
const Path =path.join("./public");
const basePath=path.resolve(Path);
console.log("base path::",basePath)


router.get("/*", (req, res) => {
  const filePath = req.params[0];
  const fullPath = path.join(basePath, filePath);

  if (req.query.action === "download") {
    const fileName = path.basename(filePath);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  }

  res.sendFile(fullPath);
});



// inserting a  files 
router.post("/*",async(req,res)=>{
    
    const filePath=req.params[0];
    console.log("inserting :: ",filePath)
    const writeStream=fs.createWriteStream(`${basePath}/${filePath}`);
    try{
    await pipeline(req,writeStream);
    res.json({message:"uploaded successfully "})
    }catch(err){
        res.json("fail to upload file ")
    }
    
})


// deleting files and folder 
router.delete("/*",async(req,res)=>{
    const filename=req.params[0]
    console.log(filename)
    const filePath=`${basePath}/${filename}`;
    console.log(filePath)
    console.log("basename :: ",basename(filePath))
    try{ 
      
    await rm(filePath,{recursive:true});
    }catch(err){
        console.log("error :::",err)
        res.send("no such file or dir ")
        return
    }
    res.json({message:"deleted successfully "})
})


export default router;