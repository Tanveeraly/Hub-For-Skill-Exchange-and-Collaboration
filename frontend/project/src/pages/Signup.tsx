import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import GoogleAuthButton from '../lib/Scoialogin.tsx';
import AuthLayout from '../components/layout/AuthLayout';
import VerifyCodeForm from '../components/VerifyCodeForm';
import { Button, Input } from '../components/ui';
import { API_BASE } from '../config';
import { toast } from '../lib/toast';

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>;

const nextSteps = [
  'Verify your email with the code we send you.',
  'Add the skills you can teach and want to learn.',
  'Find someone in the marketplace and send a swap request.',
];

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!formData.name.trim()) next.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) next.email = 'Enter a valid email address.';
    if (formData.password.length < 6) next.password = 'Use at least 6 characters.';
    if (formData.password !== formData.confirmPassword) next.confirmPassword = 'The passwords do not match.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, formData);
      if (res.data?.success || res.status === 201 || res.data?.statusCode === 201 || res.data?.message === 'Success') {
        setStep('verify');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || 'We could not create your account. Please try again.';
      if (/already exist/i.test(message)) {
        setErrors({ email: 'An account with this email already exists.' });
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <AuthLayout title="Check your email" subtitle="Step 2 of 2" asideTitle="What happens next" asideSteps={nextSteps}>
        <VerifyCodeForm
          email={formData.email}
          onBack={() => setStep('details')}
          onVerified={() => {
            toast.success('Your email is verified. Sign in to continue.');
            navigate('/login', { state: { email: formData.email } });
          }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Step 1 of 2 · It's free and takes about two minutes."
      asideTitle="What happens next"
      asideSteps={nextSteps}
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary-700 hover:underline">Sign in</Link></>}
    >
      <div className="flex justify-center">
        <GoogleAuthButton text="signup_with" setSuccess={() => {}} setError={(m) => setFormError(m)} />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-neutral-500">
        <span className="h-px flex-1 bg-neutral-200" />
        or sign up with email
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input label="Full name" name="name" autoComplete="name" value={formData.name} onChange={handleChange} error={errors.name} />
        <Input label="Email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} error={errors.email} />

        <div>
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="mt-1.5 flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPassword ? 'Hide password' : 'Show password'}
          </button>
          {!errors.password && <p className="mt-1 text-xs text-neutral-500">At least 6 characters.</p>}
        </div>

        <Input
          label="Confirm password"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        {formError && <p role="alert" className="rounded-md border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">{formError}</p>}

        <Button type="submit" loading={loading} className="w-full py-2.5">
          Continue
        </Button>
      </form>
    </AuthLayout>
  );
}
