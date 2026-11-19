import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { API_BASE } from '../config';

interface GoogleAuthButtonProps {
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export default function GoogleAuthButton({ setSuccess, setError, text = 'signin_with' }: GoogleAuthButtonProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        setError('No credentials received from Google.');
        return;
      }

      const token = credentialResponse.credential;

      const res = await axios.post(
        `${API_BASE}/auth/social-login`,
        { token },
        { withCredentials: true } // allow cookies
      );

      // Use HTTP status code instead of comparing message
      if (res.status === 200) {
        console.log('Google login successful:', res.data);

        const user = res.data.data || res.data.user;
        const accessToken = res.data.data?.accessToken || res.data.accessToken || res.data.token;
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        if (res.data.data?.refreshToken || res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.data?.refreshToken || res.data.refreshToken);
        }

        setSuccess('Logged in with Google successfully!');
        dispatch(setUser(user));
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      } else {
        setError('Google login failed. Please try again.');
      }
    } catch (err: any) {
      console.error(err.response || err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Google login failed');
      }
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleLogin}
      onError={() => setError("Google sign-in did not work. Try again or use your email.")}
      text={text}
      width="320"
    />
  );
}
