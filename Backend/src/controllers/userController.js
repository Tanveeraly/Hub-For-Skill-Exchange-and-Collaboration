import bycrypt from "bcryptjs";
import { createUser, findUserByEmail,userProfileUpdate,addPortfolio} from "../models/UserModel.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { generateRefreshAndAccessToken } from "../utlis/jwt.js";
import { verifyOtp, generateAndStoreOtp } from "../utlis/otpServices.js";
import { sendEmail } from "../utlis/emailServices.js";
import { PrismaClient } from "../generated/prisma/index.js";
import { profile } from "console";
import { OAuth2Client } from 'google-auth-library';
import { uploadOncloudinary } from "../utlis/cloudinary.js";
import crypto from "crypto"; //  import for Node's crypto
import { logAuditEvent } from "./security.controller.js";
import nodemailer from "nodemailer"; //  nodemailer for email sending


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const prisma = new PrismaClient();
const registerUser = asynHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new apiError(400, "All fields are required"));
  }

  //check if user already exist
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return next(new apiError(400, "User already exist with this email"));
  }

  //HASH PASSWORD

  const hashedPassword = await bycrypt.hash(password, 10);
  const user = await createUser({
    name,
    email,
    password: hashedPassword, 
    isVerified: false,
  });
  const createdUser = await findUserByEmail(email);
  const { password: _, refreshToken, ...safeUser } = createdUser;

  // generate OTP and send
  const otp = await generateAndStoreOtp(email);

  // Send OTP
  await sendEmail(
    email,
    "Email Verification",
    `Hi ${name},\nYour verification code is ${otp}. It expires in ${
      process.env.OTP_TTL_SECONDS || 300
    } seconds.`
  );

  // Log registration event
  logAuditEvent({
    action: 'REGISTRATION',
    category: 'AUTH',
    description: `New user registered: ${email}`,
    severity: 'INFO',
    userId: createdUser.id,
    ipAddress: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        safeUser,
        "User created. OTP sent to your email for verification."
      )
    );
});

const loginUser = asynHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new apiError(400, "All fields are required"));
  }

  const user = await findUserByEmail(email);
  if (!user) {
    logAuditEvent({
      action: 'FAILED_LOGIN',
      category: 'AUTH',
      description: `Failed login attempt for non-existent email: ${email}`,
      severity: 'WARNING',
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });
    return next(new apiError(401, "user not found with this email"));
  }
   if (user.isVerified==="false") {
      return next(new apiError(401, "Please verify your email before logging in."));
    }
  if (!user.password) {
    return next(new apiError(401, "This account uses social login. Please log in with Google."));
  }

  const isPasswordMatch = await bycrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    logAuditEvent({
      action: 'FAILED_LOGIN',
      category: 'AUTH',
      description: `Failed login: password mismatch for ${email}`,
      severity: 'WARNING',
      userId: user.id,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });
    return next(new apiError(401, "Invalid credentials password mismatch"));
  }

  const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
    user.id
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Log successful login
  logAuditEvent({
    action: 'LOGIN',
    category: 'AUTH',
    description: `User logged in: ${user.name} (${email})`,
    severity: 'INFO',
    userId: user.id,
    ipAddress: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
  });

  return res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .status(200)
    .json(
      new ApiResponse(200, {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        refreshToken,
        accessToken,
      }, "Login successful")
    );
});

const getme = asynHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new apiError(401, "Unauthorized"));
  }

  // Fetch user with related profile
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      role: true,
      provider: true,
      providerId: true,
      createdAt: true,
      updatedAt: true,
      // Include profile details
      profile: {
        select: {
          bio: true,
          avatarUrl: true,
          coverimageUrl: true,
          socialLinks: true,
          website: true,
          location: true,
          profileVisibility: true,
        },
      },
      // Optionally include skills or portfolio count
      skills: {
        select: {
          skillName: true, // Adjust according to your UserSkill model
        },
      },
    },
  });

  if (!user) {
    return next(new apiError(404, "User not found"));
  }

  return res.status(200).json(
    new ApiResponse(200, user, "User fetched successfully")
  );
});

const logoutUser = asynHandler(async (req, res, next) => {
  // Remove refresh token from DB
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  // Log logout
  logAuditEvent({
    action: 'LOGOUT',
    category: 'AUTH',
    description: `User logged out: ${req.user.name || req.user.email}`,
    severity: 'INFO',
    userId: req.user.id,
    ipAddress: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
  });

  // ✅ Clear cookies first
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);

  // ✅ Then send response
  res.status(200).json(new ApiResponse(200, {}, "User logout successfully"));
});


const socialLogin = asynHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  // 1️⃣ Verify token with Google
  const verify = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { email_verified, name, email, picture, sub } = verify.getPayload(); 
  // 'sub' is the unique Google user ID

  if (!email_verified) {
    return res.status(400).json({ message: "Email not verified by Google" });
  }

  // 2️⃣ Check if user exists
  let user = await findUserByEmail(email);

  // 3️⃣ Create user if doesn't exist
  if (!user) {
    user = await createUser({
      name,
      email,
      password: null, // No password for social login
      isVerified: true,

     // avatarUrl: picture,
      provider: "google",       // <-- Save provider
      providerId: sub,          // <-- Save Google user ID
    });
  } else {
    // Optional: Update providerId if user exists but providerId is empty
    if (!user.providerId) {
      user.provider = "google";
      user.providerId = sub;
     // await user.save();
    }
  }

  // 4️⃣ Generate tokens
  const { accessToken, refreshToken } = await generateRefreshAndAccessToken(user.id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Log social login
  logAuditEvent({
    action: 'LOGIN',
    category: 'AUTH',
    description: `Social login (Google): ${user.name} (${email})`,
    severity: 'INFO',
    userId: user.id,
    ipAddress: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    metadata: { provider: 'google' },
  });

  // 5️⃣ Send response with cookies
  return res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .status(200)
    .json(
      new ApiResponse(200, {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        avatarUrl: picture,
        provider: user.provider,
        providerId: user.providerId,
      }, "Login successful")
    );
});

const forgotPasswordd = asynHandler(async (req, res, next) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return next(new apiError(400, "Email and new password are required"));
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return next(new apiError(404, "User not found"));
  }

  const hashedNewPassword = await bycrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hashedNewPassword },
  });

  logAuditEvent({
    action: 'PASSWORD_CHANGE',
    category: 'SECURITY',
    description: `Password reset via forgot password for ${email}`,
    severity: 'WARNING',
    userId: user.id,
    ipAddress: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});

const resetPassword = asynHandler(async (req, res, next) => {
 const { email, oldPassword, newPassword } = req.body;  
  if (!email || !oldPassword || !newPassword) {
    return next(new apiError(400, "All fields are required"));
  }

  const user = await findUserByEmail(email);  
  if (!user) {
    return next(new apiError(404, "User not found"));
  }
  if (!user.password) {
    return next(new apiError(401, "This account uses social login. You cannot reset password this way."));
  }

  const isPasswordMatch = await bycrypt.compare(oldPassword, user.password);
  if (!isPasswordMatch) {
    return next(new apiError(401, "Old password is incorrect"));
  }
  const hashedNewPassword = await bycrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hashedNewPassword },
  });
  logAuditEvent({
    action: 'PASSWORD_CHANGE',
    category: 'SECURITY',
    description: `Password changed by user: ${email}`,
    severity: 'INFO',
    userId: user.id,
    ipAddress: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});


const resendOtp = asynHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isVerified)
    return res.status(200).json({ message: "User already verified" });

  const otp = await generateAndStoreOtp(email);
  await sendEmail({
    to: email,
    subject: "Your verification code (resend)",
    text: `Your verification code is ${otp}. It expires in ${
      process.env.OTP_TTL_SECONDS || 300
    } seconds.`,
  });
  return res.status(200).json(new ApiResponse(200, null, "OTP resent successfully"));
});

const verify = asynHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isVerified)
    return res.status(200).json({ message: "User already verified" });

  // verify OTP (will remove OTP on success)
  await verifyOtp(email, otp);

  // mark user verified
  await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  return res.status(200).json(new ApiResponse(200, null, "User verified successfully"));
});

const userprofile = asynHandler(async (req, res, next) => {

  const { email } = req.params;
  console.log(email);
  console.log(req.params)
  const {bio, website, location, socialLink, profileVisibility} = req.body;
console.log(req.body)
  const user = await findUserByEmail(email);
  if (!user) {
    return next(new apiError(404, "User not found"));
  }
  const avatarUrllocalPath = req.files?.avatrurl?.[0]?.path;
  const coverImageUrllocalPath = req.files?.coverimageurl?.[0]?.path;

  // Fetch user with profile to check existing images
  const userWithProfile = await prisma.user.findUnique({
    where: { email },
    include: { profile: true }
  });

  if (!userWithProfile) {
    return next(new apiError(404, "User not found"));
  }

  let avatarUrl = userWithProfile.profile?.avatarUrl;
  if (avatarUrllocalPath) {
    const uploadResult = await uploadOncloudinary(avatarUrllocalPath);
    if (uploadResult) avatarUrl = uploadResult.url;
  }

  let coverImageUrl = userWithProfile.profile?.coverimageUrl;
  if (coverImageUrllocalPath) {
    const uploadResult = await uploadOncloudinary(coverImageUrllocalPath);
    if (uploadResult) coverImageUrl = uploadResult.url;
  }
  
  const updatedData = {
    bio: bio !== undefined ? bio : userWithProfile.profile?.bio,
    avatarUrl: avatarUrl,
    coverimageUrl: coverImageUrl,
    socialLinks: socialLink !== undefined ? socialLink : userWithProfile.profile?.socialLinks,
    website: website !== undefined ? website : userWithProfile.profile?.website,
    location: location !== undefined ? location : userWithProfile.profile?.location,
    profileVisibility: profileVisibility !== undefined ? profileVisibility : (userWithProfile.profile?.profileVisibility || 'PUBLIC'),
  };
  const updatedUser = await userProfileUpdate(email, updatedData);
  const { password: _, refreshToken, ...safeUser } = updatedUser;

  return res
    .status(200)
    .json(new ApiResponse(200, safeUser, "User profile updated successfully"));
});
/* id          Int      @id @default(autoincrement())
  title       String
  description String?
  mediaUrl    String?
  mediaType   MediaType?
  createdAt   DateTime @default(now())
*/

const getusers=asynHandler(async(req,res)=>{
  const users=await prisma.user.findMany({
   select:{
    id:true,
    name:true,
    email:true,
    profile:true,
   }}
  )

  return res
  .status(200)
  .json(new ApiResponse(200, users, "Users fetched successfully"))

}
)


const adduserPortfolio = asynHandler(async (req, res, next) => {
  const { title, description, mediaType } = req.body;
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, null, "No media file uploaded"));
  }

  // Upload file to Cloudinary
  const uploadResult = await uploadOncloudinary(req.file.path);
  const mediaUrl = uploadResult?.url;

  if (!mediaUrl) {
    return res.status(500).json(new ApiResponse(500, null, "Failed to upload file to Cloudinary"));
  }

  // Check if portfolio with same title exists
  const existingPortfolio = await prisma.portfolio.findFirst({
    where: { userId, title },
  });

  let portfolio;
  if (existingPortfolio) {
    portfolio = await prisma.portfolio.update({
      where: { id: existingPortfolio.id },
      data: { description, mediaUrl, mediaType },
    });
  } else {
    portfolio = await prisma.portfolio.create({
      data: { title, description, mediaUrl, mediaType, userId },
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, portfolio, existingPortfolio ? "Portfolio updated" : "Portfolio created"));
});



const getUserPortfolio = asynHandler(async (req, res, next) => {
  const { email } = req.params;

  if (!email) {
    return next(new apiError(400, "Email is required"));
  }

  // Find user by email and include their portfolios
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      portfolios: true, // ✅ fixed: plural name from your schema
    },
  });

  if (!user) {
    return next(new apiError(404, "User not found"));
  }

  const portfolioItems = user.portfolios || [];

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        portfolioItems,
        portfolioItems.length > 0
          ? "Portfolio fetched successfully"
          : "No portfolio items found"
      )
    );
});

const getUserSkills = asynHandler(async (req, res, next) => {
  const { email } = req.params;

  // Find user first
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return next(new apiError(404, "User not found"));

  // Fetch all skills for this user
  const userSkills = await prisma.userSkill.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      skillName: true,
      expertiseLevel: true,
      //createdAt: true, // optional, if you have timestamps
     // updatedAt: true, // optional
    },
    orderBy: {
      skillName: "asc", // optional: alphabetical order
    },
  });

  res.status(200).json(
    new ApiResponse(200, userSkills, "User skills fetched successfully")
  );
});



const addMultipleUserSkills = asynHandler(async (req, res, next) => {
  const { email } = req.params;
  const { skills } = req.body;

  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return next(new apiError(400, "Skills array is required and must not be empty"));
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return next(new apiError(404, "User not found"));

  const levelMap = {
    beginner: "BEGINNER",
    intermediate: "INTERMEDIATE",
    advanced: "ADVANCED",
    expert: "EXPERT",
  };

  // Normalize and validate skills
  const skillsData = skills.map(skill => {
    const expertiseLevel = skill.expertiseLevel || skill.ExpertiseLevel;
    if (!skill.skillName || !expertiseLevel) {
      throw new apiError(400, "Each skill must have skillName and expertiseLevel");
    }

    const mappedLevel = levelMap[expertiseLevel.toLowerCase()];
    if (!mappedLevel) {
      throw new apiError(400, `Invalid expertise level: ${expertiseLevel}. Must be one of: Beginner, Intermediate, Advanced, Expert`);
    }

    return {
      skillName: skill.skillName,
      expertiseLevel: mappedLevel,
      userId: user.id,
    };
  });

  // Check for duplicates
  const existingSkills = await prisma.userSkill.findMany({
    where: { userId: user.id, skillName: { in: skillsData.map(s => s.skillName) } },
  });

  if (existingSkills.length > 0) {
    const duplicates = existingSkills.map(s => s.skillName).join(", ");
    return next(new apiError(400, `Some skills already exist: ${duplicates}`));
  }

  const createdSkills = await prisma.userSkill.createMany({
    data: skillsData,
    skipDuplicates: true,
  });

  const addedSkills = await prisma.userSkill.findMany({
    where: { userId: user.id, skillName: { in: skillsData.map(s => s.skillName) } },
  });

  res.status(201).json(new ApiResponse(201, addedSkills, `${createdSkills.count} skills added successfully`));
});

const createSkillListingByEmail = asynHandler(async (req, res, next) => {
  const { email } = req.params; // email comes from URL params
  const { title, description, location, isFeatured, categoryId } = req.body;

  // Validate required fields
  if (!title) {
    return next(new apiError(400, "Title is required"));
  }

  // Find the user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return next(new apiError(404, "User not found"));

  

  // Create the skill listing
  const skillListing = await prisma.skillListing.create({
    data: {
      title,
      description: description || null,
      location: location || null,
      isFeatured: isFeatured || false,
      userId: user.id,
     // categoryId: categoryId || null,
    },
  });

  res.status(201).json(
    new ApiResponse(201, skillListing, "Skill listing created successfully")
  );
});


const getAllUsersFullInfo = asynHandler(async (req, res, next) => {
  const users = await prisma.user.findMany({
    where: {
      profile: {
        profileVisibility: 'PUBLIC'
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      role: true,
      provider: true,
      providerId: true,
      createdAt: true,
      updatedAt: true,

      // ✅ Include Profile Info
      profile: {
        select: {
          bio: true,
          avatarUrl: true,
          coverimageUrl: true,
          socialLinks: true,
          website: true,
          location: true,
          profileVisibility: true,
        },
      },

      // ✅ Include Skills
      skills: {
        select: {
          id: true,
          skillName: true,
          expertiseLevel: true,
        },
        orderBy: {
          skillName: "asc",
        },
      },

      // ✅ Include Portfolios
      portfolios: {
        select: {
          id: true,
          title: true,
          description: true,
          mediaUrl: true,
          mediaType: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      // ✅ Include Skill Listings (correct relation name)
      listings: {
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          isFeatured: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!users || users.length === 0) {
    return next(new apiError(404, "No users found"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      users,
      "All users with full profile, skills, portfolios, and skill listings fetched successfully"
    )
  );
});


const forgotPassword = asynHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return next(new apiError(404, "User not found with this email"));
  }

  // ✅ Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { email },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpire,
    },
  });

  // ✅ Reset link (frontend route)
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // ✅ Configure email transport
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"SkillLink Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.name || "User"},</p>
      <p>Click the button below to reset your password. This link will expire in 10 minutes.</p>
      <a href="http://localhost:5173/forgetpass" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
      <p>If you didn’t request this, you can safely ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  return res.status(200).json(
    new ApiResponse(200, null, "Password reset link sent to your email.")
  );
});



export { registerUser, resendOtp, verify, loginUser ,resetPassword,userprofile,adduserPortfolio,getusers,socialLogin,logoutUser,getme,getUserPortfolio,getUserSkills,addMultipleUserSkills,createSkillListingByEmail,getAllUsersFullInfo,forgotPassword,forgotPasswordd};
