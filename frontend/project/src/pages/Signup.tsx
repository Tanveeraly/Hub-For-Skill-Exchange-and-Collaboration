import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleAuthButton from '../lib/Scoialogin.tsx';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Alert from '../components/Alert';
import axios from 'axios';
// Import



export default function Signup() {

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // ✅ Local validation before API call
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/v1/auth/register', formData);

      if (res.data?.success || res.status === 201 || res.data?.statusCode === 201 || res.data?.message === "Success") {
        console.log("✅ Signup success:", res.data.message);
        setSuccess(res.data.message || "User created. OTP sent to your email for verification.");
        setError(null);
        setOtpModal(true);
      }
    } catch (err: any) {
      console.error("🚨 Full error object:", err);

      if (axios.isAxiosError(err)) {
        const backendMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Signup failed. Please try again.";

        console.log("📩 Backend message:", backendMessage);

        if (backendMessage === "User already exist with this email") {
          setTimeout(() => setError(backendMessage), 10);
          setSuccess(null);
        } else {
          setError(backendMessage);
        }
      } else {
        setError("Unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  /*
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
  
      try {
    setLoading(true);
  
    const res = await axios.post('http://localhost:5000/api/v1/auth/register', formData);
  
    // ✅ Success case
    if (res.data?.message === "Success") {
      console.log("✅ Signup success:", res.data.message);
      setSuccess(res.data.message);
      setError(null);
      setOtpModal(true);
    }
  
  } catch (err: any) {
    console.error("🚨 Full error object:", err);
  
    if (axios.isAxiosError(err)) {
      // ✅ Get the backend message safely
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Signup failed. Please try again.";
  
      console.log("📩 Backend message:", backendMessage);
  
      if (backendMessage === "User already exist with this email") {
        setTimeout(() => setError(backendMessage), 10)
        setSuccess(null);
      } else {
        setError(backendMessage);
      }
    } else {
      setError("Unexpected error occurred. Please try again later.");
    }
  
  } finally {
    setLoading(false);
  }
  
    };
    */
  const handleOtpVerify = async () => {
    console.log("🟦 OTP Verify clicked");
    console.log("Email sent to backend:", formData.email);
    console.log("OTP entered:", otp);

    try {
      const res = await axios.post('http://localhost:5000/api/v1/auth/verify-otp', {
        email: formData.email,
        otp,
      });

      console.log("🟢 Backend response:", res.data);

      if (res.data?.success || res.data?.message === 'Success' || res.data?.message === 'OTP verified successfully' || res.data?.message === 'User verified successfully' || res.status === 200) {
        alert('OTP verified successfully!');
        setSuccess(res.data.message || 'OTP verified successfully');
        setOtpModal(false);

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        alert(`Unexpected response: ${res.data.message}`);
      }
    } catch (err: any) {
      console.error("🔴 Error verifying OTP:", err.response?.data || err.message);
      alert(err.response?.data?.message || 'OTP verification failed');
      setOtpModal(false)
    }
  };

  const handleSocialSignup = (provider: string) => {
    console.log(`Sign up with ${provider}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card card-hover p-8 relative">


          {/* 🔹 Main Signup Form */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4">
              <img
                src="/hsec-logo.png"
                alt="HSEC"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">Create Account</h2>
            <p className="text-neutral-600 mt-2">Join HSEC and start collaborating</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input pl-10 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 mt-1"
              />
              <label className="ml-2 text-sm text-neutral-600">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            {success && <Alert type="Success" message={success} />}
            {error && <Alert type="error" message={error} />}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">Or sign up with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <GoogleAuthButton setSuccess={setSuccess} setError={setError} />
              <button
                type="button"
                onClick={() => handleSocialSignup('facebook')}
                className="flex items-center justify-center px-4 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition"
              >
                <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleSocialSignup('linkedin')}
                className="flex items-center justify-center px-4 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition"
              >
                <svg className="w-5 h-5 text-primary-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
            </div>
            {/* ✅  alert message BELOW the box */}

          </div>

          <p className="mt-8 text-center text-sm text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* 🔹 OTP Modal (Popup) */}
      {otpModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-80 text-center">
            <h3 className="text-xl font-semibold mb-3 text-neutral-800">Verify Your OTP</h3>
            <p className="text-sm text-neutral-600 mb-4">
              We’ve sent a 6-digit OTP to your email <br />
              <span className="font-semibold text-primary-600">{formData.email}</span>
            </p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button" // ✅ prevent form submission
              onClick={handleOtpVerify}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => setOtpModal(false)}
              className="mt-3 text-sm text-neutral-500 hover:text-neutral-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}