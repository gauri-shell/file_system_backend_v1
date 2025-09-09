import express from "express";
import {rm} from "fs/promises"
import { ObjectId } from "mongodb";


const router=express.Router(); 

// // getting dirlist 

router.get("/:dirId?", async (req, res) => {
  const db=req.db;
  const user=req.user;
  const dirId=req.params.dirId ? ObjectId.createFromHexString(req.params.dirId) : user.rootDirId;
  const dirCollection=db.collection("directories");
 

  // find the dir and verify ownerShip by comparing user._id
  const directoryData=await dirCollection.findOne({_id: dirId,userId:user._id}); 

// if there is no directory found 
  if(!directoryData){
    return res.status(404).json({error: "Directory not found !"})
  }
  
 
    const files=await db.collection("files").find({parentDirId:dirId,userId:user._id}).toArray();
    const directories=await dirCollection.find({parentDirId:dirId,userId:user._id}).toArray();


    return res.status(200).json({...directoryData,
      files:files.map((dir)=>({...dir,id:dir._id})),
      directories:directories.map((dir)=>({...dir,id:dir._id}))
    })

});



// creating dir 
router.post("/:parentDirId?",async(req,res)=>{
  const db=req.db;
  const user=req.user;
  const parentDirId=req.params.parentDirId ? ObjectId.createFromHexString(req.params.parentDirId) : user.rootDirId;
  const dirname=req.headers.dirname || "New Folder";
  const dirCollection=db.collection("directories");

  
  try{
    // comparing the user._id make sure the ownership 
  const parentDir=await dirCollection.findOne({_id:parentDirId,userId:user._id});
  if(!parentDir){
    return res.status(404).json({message:"directory not found "})
  }
  await dirCollection.insertOne({
    name:dirname,
    parentDirId,
    userId:user._id,
  })
    return res.status(201).json({message:'dir created successfully '})
  }catch(err){
    
    return res.status(500).json({message:"fail to create directory "});
  }

});

// rename dir 
router.patch("/:dirId",(express.json()),async(req,res)=>{
  const user=req.user;
  const {dirId}=req.params;
  const db=req.db;
  const newDirName=req.body.newDirName 
  const dirCollection=db.collection('directories');
  
  // fidning dirData and authorizing by comparing user._id
  const dirData=await dirCollection.findOne({_id:ObjectId.createFromHexString(dirId),userId:user._id});
  if(!dirData){
    return res.status(404).json({message:"directory not found ! "})
  }

  try{
    
  // update in dbs 
  await dirCollection.updateOne(
    {
    _id:ObjectId.createFromHexString(dirId),
    userId:user._id
   },
    {$set:{name:newDirName}}
  )
    return res.status(201).json({message:"rename successfully "})

  }catch(err){
    console.error("fail to rename dir err:: ",err)
    return res.status(500).json({message:"fail to rename "});
  }

})

// DELETE DIR :: 
// Helper function: recursively delete directory and its contents
router.delete("/:dirId", async (req, res) => { 
  const user=req.user;
  const db=req.db;
  const { dirId } = req.params;
  const dirsCollection=db.collection("directories");
  const filesCollection=db.collection("files");
  const dirObjId=ObjectId.createFromHexString(dirId);


  // verifying the ownership :
  const doesExist=await dirsCollection.findOne(
    {_id:dirObjId,userId:user._id},
    {projection:{_id:1}}
  );
  if(!doesExist){
    return res.status(404).json({error:"directory not found "});
  }
  
  
  const {files,dirs}=await getDirectoryContents(dirObjId,dirsCollection,filesCollection);
   
   // Remove file form public/files
  for(const {_id,extension} of files){
        await rm(`./public/${_id}${extension}`);
  }   
  await filesCollection.deleteMany({_id:{$in:files.map(({_id})=>_id)}});
  await dirsCollection.deleteMany({_id:{$in:[...dirs.map(({_id})=>_id),dirObjId] }});
 
  try {
     
    return res.status(200).json({ message: "Directory and all nested content deleted successfully" });
  } catch (err) {
    
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


// the reason we place this funcion outside of delete route handler becz every time when delete requ hit that callbac fun (req,res) will execute so it means this function will also create in Memory in every request so to avoid creation of Function in memory in each req we place this outside 
  async function getDirectoryContents(id,dirsCollection,filesCollection){
    
  let dirs=await dirsCollection.find(   
    {parentDirId:id}, 
    {projection:{_id:1}}
  ).toArray(); 
  let files=await filesCollection.find(
    {parentDirId:id},
    {projection:{extension:1}}
  ).toArray();

  // now this loop is magic to delete recursively it will automatically end when there is no length of dirs 
  for(const {_id} of dirs){ 
    const {files:childFiles,dirs:childDirs}=await getDirectoryContents(_id,dirsCollection,filesCollection); 
    files=[...files,...childFiles];
    dirs=[...dirs,...childDirs]
  }

  return {files,dirs};  
  }

export default router;


// // DELETE DIR :: 
// // Helper function: recursively delete directory and its contents
// async function deleteDirectoryRecursive(dirId) {

//   const dirIndex = dirsData.findIndex((dir) => dir.id === dirId);
//   if (dirIndex === -1) return;

//   const currentDir = dirsData[dirIndex];

//   // Step 1: Delete all files in this directory
//   for (const fileId of currentDir.files) {
//     const fileIndex = filesData.findIndex((file) => file.id === fileId);
//     if (fileIndex !== -1) {
//       const fileData = filesData[fileIndex];
//       try {
//         // removing file from './public'
//         await rm(`./public/${fileId}${fileData.extension}`);
//       } catch (err) {
//         console.warn(`Failed to delete file ${fileId}:`, err.message);
//       }
//       // removing file form filesDB.json
//       filesData.splice(fileIndex, 1);
//     }
//   }

//   // Step 2: Recursively delete all subdirectories
//   for (const subDirId of currentDir.directories) {
//     await deleteDirectoryRecursive(subDirId);
//   }

//   // Step 3: Remove this directory from dirsData
//   dirsData.splice(dirIndex, 1);
// }


// router.delete("/:dirId", async (req, res) => {
//   const user=req.user;
//   const { dirId } = req.params;

//   try {
//     const dirToDelete = dirsData.find((dir) => dir.id === dirId);
//     if (!dirToDelete) return res.status(404).json({ message: "Directory not found!" });

//     // check if the directory belongs to the user 
//     if(dirToDelete.userId !== user.id){
//       return res.status(403).json({message:"you are not authorize to delete this directory!"})
//     }

//     // Remove reference from parent
//     const parentDir = dirsData.find((d) => d.id === dirToDelete.parentDirId);
//     if (parentDir) {
//       parentDir.directories = parentDir.directories.filter((id) => id !== dirId);
//     }

//     // Recursive deletion
//     await deleteDirectoryRecursive(dirId);

//     // Write updated data
//     await fs.promises.writeFile("./filesDB.json", JSON.stringify(filesData, null, 2));
//     await fs.promises.writeFile("./foldersDB.json", JSON.stringify(dirsData, null, 2));

//     return res.status(200).json({ message: "Directory and all nested content deleted successfully" });
//   } catch (err) {
//     console.error("Failed to delete directory recursively:", err);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// });
















// // ask to GPT 

// // // getting dirlist 

// router.get("/:dirId?", async (req, res) => {
//   const user=req.user;
//   const dirId=req.params.dirId || user.rootDirId;
 

//   // find the dir and verify ownerShip
//   const directoryData= dirsData.find((dir)=>dir.id === dirId && dir.userId === user.id);
  
// // if there is no directory found 
//   if(!directoryData){
//     return res.status(404).json({error: "Directory not found or you do not have access to it!"})
//   }
 

//     // it is a mutating way so when we request second time  this rootDirData.files  is no longer an array of IDs — it's an array of full file objects. as result return null 
//     // Since Node.js keeps everything in memory for the life of the app (no reloading between requests unless you restart), your mutation in the first request affects all future requests.
//     // rootDirData.files=rootDirData.files.map((fileId)=>filesData.find((file)=>file.id === fileId));
//     // res.json(rootDirData)
    
//     // so here we create a new variable and send that new object 
//     // adding the files 
//     // const files=directoryData.files.map((fileId)=>filesData.find((file)=>file.id === fileId)).filter((item)=>item !== undefined);

//     // adding the direcotries 
//     const directories=directoryData.directories.map((dirId)=>
//       directoriesCollection.findOne({_id:dirId})
//     );
    


//     return res.status(200).json({...directoryData,directories})
// });
