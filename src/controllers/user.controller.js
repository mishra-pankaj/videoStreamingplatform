import {asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import  jwt  from "jsonwebtoken"
const generateAccessTokenAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})
        
        return {accessToken,refreshToken}
    
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating acces and refresh token ")
    }
}
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

const loginUser = asyncHandler(async (req,res)=>{
    // my view 
    // req.body - username, password  or email lenge
    // db - check karenge  
    // if matches then login and ek acces token generate hoga 
    // ----Sir view ---//
    //1. req body - data . 2 . username or email login. 3. find the user in db . 4. password check. 5. access and refresh token . 6. send cookies

    const {email, username, password} = req.body
    if(!(username || email)) {
        throw new ApiError(400, "Username or Email required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exits")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }
    const {accessToken, refreshToken}= await generateAccessTokenAndRefreshToken(user._id)

    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
    status(200).
    cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedinUser, accessToken,
                refreshToken
            },
            "User logged IN succesfully"

        )
    )
    
} )

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new : true
        }
    )
     const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"User looged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingrefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingrefreshToken){
        throw new ApiError(401,"Unauthorized request ")
    }

    try {
        const decodedToken = jwt.verify(
            incomingrefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token ")
        }
    
        if(incomingrefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newrefreshToken } = await generateAccessTokenAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("acessToken", accessToken, options)
        .cookie("refreshToken",newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Acess token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken

} 