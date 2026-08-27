
import fs from "fs"
import { v2 as cloudinary } from 'cloudinary';


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

 
 
    const uploadOncloudinary = async (localFilePath) => {
        
        try {
            if (!localFilePath) return null
            //upload file on cloudinary 
             const response =  await cloudinary.uploader.upload(localFilePath,{
                resource_type: "auto"
             })
             //File is successfully Uploaded
             console.log("File is successfully Uploaded",response.url);
             fs.unlinkSync(localFilePath)
             return response;
        } catch (error) {
            fs.unlinkSync(localFilePath)
            //this will remove the file from local server
            
        }
    }
    export{uploadOncloudinary}