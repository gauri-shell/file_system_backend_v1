import { connectDB,client } from "./db.js";


// you can use db.createCollection as well but we do db.commad() because if we want to modify our schema in future then we have to use collMod instead of create 
// if schema is already exist the we have to use colMod to update it some times it will show already exist even if we remove that validation for mongosh there will be a {} empty obj schem so in that case we use collMod to update it 
// it will show error like : storageApp.users already exists

const db=await connectDB()
try{
    
const command="create" // if schema is not already exist then use "create" command else use "collMod"

// for users collection 
await db.command({
    [command]:"users",
    validator:{
  $jsonSchema: {
    bsonType: 'object',
    required: [
      '_id',
      'name',
      'email',
      'password',
      'rootDirId'
    ],
    properties: {
      _id: {
        bsonType: 'objectId'
      },
      name: {
        bsonType: 'string',
        minLength: 3,
        maxLength: 30,
        description:"name field should be a string wit atleast 3 character "
      },
      email: {
        bsonType: 'string',
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        description:"please enter a valid email"
      },
      password: {
        bsonType: 'string',
        minLength: 4,
        maxLength: 14,
        description:"password lenght should be at least 4 character "
      },
      rootDirId: {
        bsonType: 'objectId'
      }
    },
    additionalProperties: false

  }
},
validationAction:"error",
validationLevel:"strict",
});

// for directories collection 
await db.command({
    [command]:"directories",
    validator:{
  $jsonSchema: {
    bsonType: 'object',
    required: [
      '_id',
      'name',
      'parentDirId',
      'userId'
    ],
    properties: {
      _id: {
        bsonType: 'objectId'
      },
      name: {
        bsonType: 'string',
        maxLength: 50,
        description:"file name cannot be greater than 50 characters "
      },
      parentDirId: {
        bsonType: [
          'null',
          'objectId'
        ]
      },
      userId: {
        bsonType: 'objectId'
      }
    },
    additionalProperties: false
  }
},
validationAction:'error',
validationLevel:"strict"
});

// for files collection 
await db.command({
    [command]:"files",
    validator:{
  $jsonSchema: {
    bsonType: 'object',
    required: [
      '_id',
      'extension',
      'name',
      'parentDirId',
      'userId'
    ],
    properties: {
      _id: {
        bsonType: 'objectId'
      },
      extension: {
        bsonType: 'string',
        maxLength: 15,
        description:"invalid extension"
      },
      name: {
        bsonType: 'string',
        maxLength: 30,
        description:"file name too long "
      },
      parentDirId: {
        bsonType: 'objectId'
      },
      userId: {
        bsonType: 'objectId'
      }
    },
    additionalProperties: false
  }
},
validationAction:"error",
validationLevel:"strict"
})

}catch(err){
    console.log("fail to validate Schema error::");
    console.log(err)
}finally{
await client.close();

}

