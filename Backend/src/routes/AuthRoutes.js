import express from "express";
import { registerUser,verify,resendOtp,loginUser ,resetPassword,userprofile,adduserPortfolio,getusers,socialLogin,logoutUser,getme,getUserPortfolio,addMultipleUserSkills,getUserSkills,createSkillListingByEmail,getAllUsersFullInfo,forgotPassword,forgotPasswordd} from "../controllers/userController.js";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { upload } from "../middlewares/multermiddleware.js";
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & Authorization APIs
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user and send OTP for email verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tanveer Ali
 *               email:
 *                 type: string
 *                 example: tanveer@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Registration successful. OTP sent to email.
 *       400:
 *         description: Missing fields or user already exists.
 */
router.post("/register", registerUser);
router.post("/social-login",socialLogin);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user and get access & refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: tanveer@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Successful login. Returns JWT tokens.
 *       401:
 *         description: Invalid credentials.
 */
router.post("/login", loginUser);
/**
 * @swagger
 * /api/v1/logout:
 *   post:
 *     summary: Log out the current user
 *     description: Clears the user's authentication cookies (access and refresh tokens) and logs them out securely. Requires JWT authentication.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "User logged out successfully"
 *                 data:
 *                   type: object
 *                   example: {}
 *       401:
 *         description: Unauthorized — Missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Unauthorized access"
 *       500:
 *         description: Internal server error
 */
router.post("/logout",verifyjwt,logoutUser)
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: tanveer@example.com
 *               otp:
 *                 type: string
 *                 example: 123456
 *               newPassword:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Invalid or expired OTP.
 */
router.post("/reset-password",verifyjwt,resetPassword);
/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and activate user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: tanveer@example.com
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: OTP verified successfully, user created.
 *       400:
 *         description: Invalid or expired OTP.
 */
router.post("/verify-otp", verify);
/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend verification OTP to user's email
 *     description: Resends a new verification code (OTP) to the user's email address if the account exists and is not already verified.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "t@gmail.com"
 *     responses:
 *       200:
 *         description: OTP resent successfully or user already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: OTP resent successfully
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/resend-otp", resendOtp);
/**
 * @swagger
 * /api/users/profile/{email}:
 *   put:
 *     summary: Update user profile
 *     description: Updates an existing user's profile information (bio, avatar URL, website, location) based on their email address.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: The email of the user whose profile will be updated.
 *         schema:
 *           type: string
 *           format: email
 *           example: "t@gmail.com"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *                 example: "I'm a full-stack developer with 3 years of experience."
 *               avatrurl:
 *                 type: string
 *                 example: "https://example.com/avatar.png"
 *               website:
 *                 type: string
 *                 example: "https://tanveerali.dev"
 *               location:
 *                 type: string
 *                 example: "Islamabad"
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: User profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 21
 *                     name:
 *                       type: string
 *                       example: "Tanveer Ali"
 *                     email:
 *                       type: string
 *                       example: "t@gmail.com"
 *                     profile:
 *                       type: object
 *                       properties:
 *                         bio:
 *                           type: string
 *                           example: "I'm a full-stack developer with 3 years of experience."
 *                         avatrurl:
 *                           type: string
 *                           example: "https://example.com/avatar.png"
 *                         website:
 *                           type: string
 *                           example: "https://tanveerali.dev"
 *                         location:
 *                           type: string
 *                           example: "Islamabad"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/update-profile/:email",upload.fields([ { name: "avatrurl", maxCount: 1 },
    { name: "coverimageurl", maxCount: 1 },]),userprofile); 

    /**
 * @swagger
 * /api/v1/addPortfolio/{email}:
 *   post:
 *     summary: Create or update a user portfolio
 *     description: Adds or updates a user's portfolio entry (image, video, or document) based on the title. Requires JWT authentication.
 *     tags:
 *       - Portfolio
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: The user's email address
 *         schema:
 *           type: string
 *           example: "user@example.com"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the portfolio entry
 *                 example: "React Dashboard UI"
 *               description:
 *                 type: string
 *                 description: Short description of the portfolio project
 *                 example: "A modern dashboard UI built with React and TailwindCSS"
 *               mediaFile:
 *                 type: string
 *                 format: binary
 *                 description: The uploaded media file (image, video, or document)
 *               mediaType:
 *                 type: string
 *                 enum: [IMAGE, VIDEO, DOCUMENT]
 *                 description: Type of media being uploaded
 *                 example: "IMAGE"
 *     responses:
 *       200:
 *         description: Portfolio created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Portfolio created"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     title:
 *                       type: string
 *                       example: "React Dashboard UI"
 *                     description:
 *                       type: string
 *                       example: "A modern dashboard UI built with React and TailwindCSS"
 *                     mediaUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/.../dashboard-ui.png"
 *                     mediaType:
 *                       type: string
 *                       example: "IMAGE"
 *                     userId:
 *                       type: integer
 *                       example: 21
 *       401:
 *         description: Unauthorized — Missing or invalid JWT token
 *       500:
 *         description: Internal server error
 */
router.post("/addPortfolio/:email",verifyjwt,upload.single("file"),adduserPortfolio);

router.get("/getusers",getusers);
router.get("/getme",verifyjwt,getme);
router.get("/getUserPortfolios/:email",verifyjwt,getUserPortfolio);
//router.post("/addUserSkill/:email",verifyjwt,addUserSkill);
router.get("/getUserSkills/:email",verifyjwt,getUserSkills);
router.post("/addMultipleUserSkills/:email",verifyjwt,addMultipleUserSkills);
router.post("/createSkillListing/:email",verifyjwt,createSkillListingByEmail);
router.get("/getAllUsersFullInfo",getAllUsersFullInfo);
router.post("/forgot-password",forgotPassword);
router.post("/forgot-passwordd",forgotPasswordd);   


export { router as authRouter };
