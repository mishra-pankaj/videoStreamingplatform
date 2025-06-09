// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs"

// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const uploadOnCloudinary= async (localFilePath)=>{
//     try {
//         if(!localFilePath){
//             console.log("could not find local path");
//             return null;
//             // upload file on cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath,{
//             resource_type:"auto"
//         })
//             //file has been uploaded succesfully
//         console.log("File has been upload sucessfully!!",response.url);
//         return response  
//         }
//     } catch (error) {
//         fs.unlinkSync(localFilePath)//remove the locally saved temp file as the upload operaton fet failde
//         return null
//     }
// }

// export {uploadOnCloudinary}

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("Could not find local path");
      return null;
    }

    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    // file has been uploaded successfully
    console.log("File has been uploaded successfully!!", response.url);

    // remove local temp file after successful upload
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // remove local file if upload failed
    }

    return null;
  }
};

export { uploadOnCloudinary };
