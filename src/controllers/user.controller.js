import {asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async (req,res)=>{
    
    //get user detail from frontend 
    //validation - not empty 
    //xheck if already exist -username &email 
    //file-avtar and coverimage 
    //upload to cloudniary,avtar 
    //crreate user object -create entry in db 
    //remove password qand refresh token 
    // check for user creation
    // return response 

    // console.log("REQ.FILES:", req.files);
    // console.log("REQ.BODY:", req.body);

    const {fullname, email, username, password} = req.body
    // console.log("email:", email);
    
    // // check
    // if(fullname ===""){
    //     throw new ApiError(400,"Fullname is required")
    // }
    // if(email ===""){
    //     throw new ApiError(400,"Email is required")
    // }
    // if(username ===""){
    //     throw new Apihd@hd.com){
    //     throw new ApiError(400,"Password is required")
    // }

    if([fullname, email, username, password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }
    if(!email.includes("@")){
        throw new ApiError(400,"Invalid email");   
    }

    const existedUser = await User.findOne({
        $or: [
            {email: email},
            {username: username}
        ]
    })
    
    if(existedUser){
        throw new ApiError(409,"User email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImagelocalPath = req.files?.coverImage[0]?.path
    
    let coverImagelocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0){
        coverImagelocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath) {
        throw new ApiError(400,"Avatar is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagelocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something Went wrong!! while registering a user")
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Succesfully")
    )
})


export {registerUser}