import dotenv from "dotenv"

import connectDB from "./db/index.js";
import { app } from "./app.js";



dotenv.config({
    path:"./.env"
})
const PORT_OG = process.env.PORT || 8000
connectDB()
  .then(()=> {
    app.listen(PORT_OG,()=>{
        console.log(`Server is running at port ${PORT_OG}`);
        
    })
  })
  .catch((err)=>{
    console.log(`Error db connection failed!!${err}`);
    
  })