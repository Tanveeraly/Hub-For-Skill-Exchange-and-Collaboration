import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import Alert from '../components/Alert';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import GoogleAuthButton from '../lib/Scoialogin.tsx'

interface FormData {
  email: string;
  password: string;
}

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post(
        'https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/auth/login',
        formData,
        { withCredentials: true }
      );

      // If OTP is required
      if (res.data.message?.includes('verify your email')) {
        setLoading(false);
        setOtpModal(true); // show modal immediately
        setSuccess(res.data.message);
        return;
      }

      // If login success
      if (res.data.success) {
        setSuccess('Login successful!');
        const user = res.data.data || res.data.user;
        dispatch(setUser(user));
        
        setTimeout(() => {
          if (user.role === 'ADMIN') {
            navigate('/admin-portal');
          } else {
            navigate('/home');
          }
        }, 1000); // redirect after 1s
      } else {
        console.log('Login response message not Success:', res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    try {
      const res = await axios.post('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/auth/verify-otp', {
        email: formData.email,
        otp,
      });

      if (res.data.message === 'User verified successfully') {
        setSuccess(res.data.message);
        setOtpModal(false);

        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verification failed');
    }
  };



  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card card-hover p-8 relative">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4">
              <img
                src="/hsec-logo.png"
                alt="HSEC"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">Welcome Back</h2>
            <p className="text-neutral-600 mt-2">Sign in to continue to HSEC</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">Email Address</label>
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
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500" />
                <span className="ml-2 text-sm text-neutral-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {success && <Alert type="Success" message={success} />}
            {error && <Alert type="error" message={error} />}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-neutral-500">Or continue with</span></div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">

              <GoogleAuthButton setSuccess={setSuccess} setError={setError} />


            </div>
          </div>

          <p className="mt-8 text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* OTP Modal */}
      {otpModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
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
            <button type="button" onClick={handleOtpVerify} className="w-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all">
              Verify OTP
            </button>
            <button type="button" onClick={() => setOtpModal(false)} className="mt-3 text-sm text-neutral-500 hover:text-neutral-700 transition">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
