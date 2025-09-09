import express from "express";
import { rm } from "fs/promises";
import fs from "fs";
import { pipeline } from "stream/promises";
import path from "path";

//  needs an import attribute of "type: json" if you want to import the json so we do with {type:"json"};
import { ObjectId } from "mongodb";
const router = express.Router();
// getting files
const Path = path.join("./public");
const basePath = path.resolve(Path);
console.log("base path::", basePath);



// improvind get file 
router.get("/:fileId", async(req, res,next) => { 
  const db=req.db;
  const user=req.user;
  const {fileId}=req.params;

  console.log("fileId::",fileId);
  console.log("fileIdObj::",ObjectId.createFromHexString(fileId))
  console.log("user iD ",user._id)
  console.log("user ::",user)
  // checking the userId as well to verify the ownership
  const reqFileData=await db.collection("files").findOne({_id:ObjectId.createFromHexString(fileId),userId:user._id});
  console.log("requested file ::",reqFileData)
  if(!reqFileData){
    return res.status(404).json({message:"file not found"})
  }

  const reqFilePath = path.join(basePath, `${fileId}${reqFileData.extension}`);

// if "download" is requested set the appropriate headers
  if (req.query.action === "download") {
    // res.set("Content-Disposition", `attachment; filename="${reqFileData.name}"`);
     return res.download(reqFilePath,reqFileData.name) // this is provided by express.js above and this is equivalent
  }else{
    
  return res.sendFile(reqFilePath,(err)=>{
    if(err){
    console.error("send File error ::",err);
   return next(err);
    }

  });
  }
  
});





// creatig inserting a  files
router.post("/:parentDirId?", async (req, res) => {
  const parentDirId = req.params.parentDirId
    ? ObjectId.createFromHexString(req.params.parentDirId)
    : req.user.rootDirId;

  const user = req.user;
  const db = req.db;
  const dirCollection = db.collection("directories");
  const filesCollection = db.collection("files");

  const parentDirData = await dirCollection.findOne({
    _id: parentDirId,
    userId: user._id,
  });

  // check if parent directory exist ?
  if (!parentDirData) {
    return res.status(404).json({ error: " directory not found! " });
  }

  // headers variable are always be in small letter not even camelCase so parentdirid instead of parentDirId
  const filename = req.headers.filename || "untitled";
  const extension = path.extname(filename) || ".txt";

  const insertedFile = await filesCollection.insertOne({
    extension,
    name: filename,
    parentDirId,
    userId: user._id,
  });
  const fileId = insertedFile.insertedId.toString();
  // generating  a custom file name with id and we will store that file name with id not with its real name
  const newFileNameWithId = `${fileId}${extension}`;

  const writeStream = fs.createWriteStream(`${basePath}/${newFileNameWithId}`);
  try {
    // piping a file
    await pipeline(req, writeStream);

    return res.status(201).json({ message: "uploaded successfully " });
  } catch (err) {
    // if user cancel or error occured then we are deleting that recently inserted files
    await filesCollection.deleteOne({ _id: insertedFile.insertedId });
    return res.status(500).json({ message: "fail to upload file " });
  }
});

// renaming the file
// i want to use req.body so i  use express.json() to parse it and i use express.json only for the routes that need it not the whole files OR all Routes because in other files i want to directly pipe it if i use it in global then express.json() tries to read and parse it as json that consume the request stream , later you will call pipelin(req,writeStream) BUT the stream is already read and empty so you will get the file with right name but without content
router.patch("/:fileId", express.json(), async (req, res) => {
  const fileObjId = ObjectId.createFromHexString(req.params.fileId);
  const db = req.db;
  const user = req.user;
  const filesCollection = db.collection("files");
  const newFileName = req.body.newFilename || "New File";

  //finding a request id file and login userId as well to check the ownerShip
  const fileData = await filesCollection.findOne({
    _id: fileObjId,
    userId: user._id,
  });

  if (!fileData) {
    return res.status(404).json({ error: "File not found!" });
  }

  try {
    // perform rename
    await filesCollection.updateOne(
      { _id: fileObjId },
      { $set: { name: newFileName } }
    );

    return res.status(200).json({ message: "Renamed " });
  } catch (err) {
    console.error("fail to pipe ::::", err);
    return res.status(500).json({ message: "fail to update " });
  }
});

// deleting files and folder
router.delete("/:fileId", async (req, res) => {
  const db = req.db;
  const user = req.user;
  const { fileId } = req.params;
  const filesCollection = db.collection("files");

  const fileData = await filesCollection.findOne({
    _id: ObjectId.createFromHexString(fileId),
    userId: user._id,
  });
  // check if file exists
  if (!fileData) {
    return res.status(404).json({ message: "file not found !" });
  }

  try {
    // Remove file form public/files
    rm(`${basePath}/${fileId}${fileData.extension}`);

    // remove file from filesDB
    await filesCollection.deleteOne({ _id: fileData._id });
    return res.status(200).json({ message: "successfully deleted" });
  } catch (err) {
    console.log("fail to delete ", err);
    return res.status(500).json({ message: "fail to delete data " });
  }
});

export default router;

// C:\Users\user\Desktop\node\expressGoogleDrive\public\689f4f18f634acb3fae6841f.webm


