import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { Button } from './ui';

interface VerifyCodeFormProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

/** Step where the user types the 6-digit code we emailed them. Stays open on mistakes. */
export default function VerifyCodeForm({ email, onVerified, onBack }: VerifyCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (code.length !== 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setVerifying(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/verify-otp`, { email, otp: code });
      if (res.status === 200 || res.data?.success) {
        onVerified();
      } else {
        setError(res.data?.message || 'We could not verify that code. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'That code is not right, or it has expired.');
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      await axios.post(`${API_BASE}/auth/resend-otp`, { email });
      setInfo('A new code is on its way. Check your inbox and spam folder.');
      setCooldown(30);
      setCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'We could not send a new code. Try again in a moment.');
    }
  };

  return (
    <form onSubmit={verify} className="space-y-5" noValidate>
      <p className="text-sm text-neutral-600">
        We sent a 6-digit code to <span className="font-medium text-neutral-900">{email}</span>. It expires after 5 minutes.
      </p>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Verification code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="123456"
          aria-invalid={!!error}
          className="input text-center text-lg tracking-[0.5em]"
        />
      </label>

      {error && <p role="alert" className="text-sm text-error-700">{error}</p>}
      {info && <p role="status" className="text-sm text-success-700">{info}</p>}

      <Button type="submit" loading={verifying} className="w-full py-2.5">
        Verify email
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-neutral-600 hover:text-neutral-900">
          ← Use a different email
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-medium text-primary-700 hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
        >
          {cooldown > 0 ? `Send a new code (${cooldown}s)` : 'Send a new code'}
        </button>
      </div>
    </form>
  );
}
