import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import GoogleAuthButton from '../lib/Scoialogin.tsx';
import AuthLayout from '../components/layout/AuthLayout';
import VerifyCodeForm from '../components/VerifyCodeForm';
import { Button, Input } from '../components/ui';
import { API_BASE } from '../config';
import { toast } from '../lib/toast';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillEmail = (location.state as { email?: string } | null)?.email ?? '';

  const [formData, setFormData] = useState({ email: prefillEmail, password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, formData, { withCredentials: true });

      if (res.data.message?.includes('verify your email')) {
        setNeedsVerification(true);
        return;
      }

      if (res.data.success) {
        const user = res.data.data || res.data.user;
        const accessToken = res.data.data?.accessToken || res.data.accessToken || res.data.token;
        const refreshToken = res.data.data?.refreshToken || res.data.refreshToken;
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        dispatch(setUser(user));
        navigate(user.role === 'ADMIN' ? '/admin' : '/home');
      } else {
        setError(res.data.message || 'We could not sign you in. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'The email or password is not correct.');
    } finally {
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <AuthLayout title="Verify your email first" subtitle="You need to confirm your email before you can sign in.">
        <VerifyCodeForm
          email={formData.email}
          onBack={() => setNeedsVerification(false)}
          onVerified={() => {
            setNeedsVerification(false);
            toast.success('Email verified. You can sign in now.');
          }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back to HubForSkills."
      asideTitle="After you sign in"
      asideSteps={[
        'Home shows anything waiting for your reply.',
        'My swaps lists your requests, sessions in progress and finished swaps.',
        'Find skills is where you search for your next partner.',
      ]}
      footer={<>New here? <Link to="/signup" className="font-medium text-primary-700 hover:underline">Create a free account</Link></>}
    >
      <div className="flex justify-center">
        <GoogleAuthButton setSuccess={() => {}} setError={setError} />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-neutral-500">
        <span className="h-px flex-1 bg-neutral-200" />
        or sign in with email
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input label="Email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} autoFocus={!prefillEmail} />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-neutral-700">Password</label>
            <Link to="/forgot-password" className="text-sm text-primary-700 hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              autoFocus={!!prefillEmail}
              className="input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-neutral-500 hover:text-neutral-800"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p role="alert" className="rounded-md border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">{error}</p>}

        <Button type="submit" loading={loading} className="w-full py-2.5">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
