import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
transporter.verify().then(() => {
    console.log("Email server is ready to take messages");

}).catch((err) => {
    console.error("Error with email server configuration", err);
});

const sendEmail = async (to, subject, text, html) => {  
    const mailOptions = {
        from: `"No Reply" <${process.env.EMAIL_USER}>`, // sender address
        to:to.trim(), // list of receivers
        subject, // Subject line
        text, // plain text body
        html, // html body
        
    }; 
     
    await transporter.sendMail(mailOptions);    
};
export { sendEmail };   