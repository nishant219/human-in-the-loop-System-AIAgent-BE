import mongoose from "mongoose";

export const DatabaseConfig = async()=>{
    try{
        const connection=await mongoose.connect(process.env.MONGODB_URI as string)
        console.log('✅ MongoDB connected successfully');
        return connection;
    }catch(err){
        console.log("Error connecting to database", err);
        process.exit(1);
    }
}