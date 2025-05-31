import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB=async()=>{
    try {
        const ConnectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`MONGODB CONNECTED SUCESFULLY!! DB HOST:${ConnectionInstance.connection.host} ` );
        
    } 
    catch (error) {
        console.log(`MONGODB CONNECTION ERROR `,error);
        process.exit(1)
        
    }
}

export default connectDB