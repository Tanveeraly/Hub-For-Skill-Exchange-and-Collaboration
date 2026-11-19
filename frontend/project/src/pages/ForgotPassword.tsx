import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/layout/AuthLayout';
import { Button, Input } from '../components/ui';
import { API_BASE } from '../config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'We could not send the email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const backToSignIn = <Link to="/login" className="font-medium text-primary-700 hover:underline">← Back to sign in</Link>;

  if (submitted) {
    return (
      <AuthLayout title="Check your email" footer={backToSignIn}>
        <div className="space-y-4 text-sm text-neutral-700">
          <p>
            If an account exists for <span className="font-medium text-neutral-900">{email}</span>, we've sent instructions to reset your password.
          </p>
          <p className="text-neutral-500">Didn't get it? Check your spam folder, or</p>
          <Button variant="secondary" className="w-full" onClick={() => setSubmitted(false)}>
            Try a different email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email you signed up with and we'll send you instructions."
      footer={backToSignIn}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          error={error ?? undefined}
        />
        <Button type="submit" loading={loading} className="w-full py-2.5">
          Send instructions
        </Button>
      </form>
    </AuthLayout>
  );
}
