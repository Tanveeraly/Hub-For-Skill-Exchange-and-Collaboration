import Redis from 'ioredis';
import crypto from 'crypto';

const redis=new Redis(process.env.REDIS_URL);

redis.on('error',(err)=>{
    console.error("Redis connection error",err);
});

const OTP_TTL=parseInt(process.env.OTP_TTL_SECONDS) ||300; // 5 minutes
const OTP_MAX_REQUESTS_PER_HOUR=parseInt(process.env.OTP_MAX_REQUESTS_PER_HOUR) ||3;
const OTP_MIN_RESEND_INTERVAL=parseInt(process.env.OTP_MIN_RESEND_INTERVAL) ||30; // seconds
const OTP_MAX_VERIFY_ATTEMPTS=parseInt(process.env.OTP_MAX_VERIFY_ATTEMPTS) ||5;        

const otpKey = (email) => `otp:${email.toLowerCase()}`;
const otpMetaKey = (email) => `otpmeta:${email.toLowerCase()}`;

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const generateAndStoreOtp = async (email) => {
  // Rate limiting: count requests in past hour
  const meta = await redis.hgetall(otpMetaKey(email));
  const now = Date.now();
   // parse meta fields
  const lastSent = meta.lastSent ? Number(meta.lastSent) : 0;
  const hourlyCount = meta.hourlyCount ? Number(meta.hourlyCount) : 0;
  const hourWindowStart = meta.hourWindowStart ? Number(meta.hourWindowStart) : now;

  // reset hourly window if older than 1 hour
  let count = hourlyCount;
  let windowStart = hourWindowStart;
  if (now - windowStart > 60 * 60 * 1000) {
    count = 0;
    windowStart = now;
  }

  if (now - lastSent < OTP_MIN_RESEND_INTERVAL * 1000) {
    throw new Error(`Please wait ${OTP_MIN_RESEND_INTERVAL} seconds before requesting new OTP.`);
  }
  if (count >= OTP_MAX_REQUESTS_PER_HOUR) {
    throw new Error("Too many OTP requests. Try again later.");
  }

  // secure random 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();

  const otpHash = hashOtp(otp);

  // store OTP hash with TTL (single key)
  await redis.set(otpKey(email), otpHash, "EX", OTP_TTL);

  // reset verify attempts
  await redis.hset(otpMetaKey(email), {
    lastSent: now,
    hourWindowStart: windowStart,
    hourlyCount: count + 1,
    attempts: 0
  });
  // set same TTL for meta (slightly longer to ensure cleanup)
  await redis.expire(otpMetaKey(email), OTP_TTL + 60);

  return otp; // plain OTP to send to user (never logged)
};

 const verifyOtp = async (email, otp) => {
  const metaKey = otpMetaKey(email);
  const meta = await redis.hgetall(metaKey);
  if (!meta) throw new Error("OTP not found or expired");

  const attempts = meta.attempts ? Number(meta.attempts) : 0;
  if (attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    // delete otp to force request new one
    await redis.del(otpKey(email));
    await redis.del(metaKey);
    throw new Error("Too many verification attempts. Please request a new OTP.");
  }

  const storedHash = await redis.get(otpKey(email));
  if (!storedHash) {
    throw new Error("OTP expired or not found. Please request a new OTP.");
  }

  const inputHash = hashOtp(otp);
  if (storedHash !== inputHash) {
    // increment attempts
    await redis.hincrby(metaKey, "attempts", 1);
    throw new Error("Invalid OTP");
  }

  // success: remove OTP and meta
  await redis.del(otpKey(email));
  await redis.del(metaKey);

  return true;
};

export {
  generateAndStoreOtp,
  verifyOtp
}