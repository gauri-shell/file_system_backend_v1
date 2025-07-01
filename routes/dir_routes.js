import express from "express";
import {mkdir, readdir,  stat} from "fs/promises"


const router=express.Router();

// getting dirlist 
router.get("/?*", async (req, res) => {
  const dirname  = req.params[0];

  const fullDirPath= `./public/${dirname ? dirname : ""}`;

  try {
    const files = await readdir(fullDirPath);
    const result = [];

    for (const item of files) {
      const stats = await stat(`${fullDirPath}/${item}`);
      result.push({ name: item, isDirectory: stats.isDirectory() });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to read directory", message: err.message });
  }
});

// creating dir 
router.post("/?*",async(req,res)=>{
  const dirPathname=req.params[0];

  try{
  await mkdir(`./public/${dirPathname}`);
  res.send({message:"successfully created"})
  }catch(err){
    res.send({message:"fail to create "})
    console.error("fail to create dir  or file already exists ",err)
  }
  
})


export default router;