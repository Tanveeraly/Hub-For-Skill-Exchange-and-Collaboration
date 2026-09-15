import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';

interface GoogleAuthButtonProps {
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
}

export default function GoogleAuthButton({ setSuccess, setError }: GoogleAuthButtonProps) {
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
        'https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/auth/social-login',
        { token },
        { withCredentials: true } // allow cookies
      );

      // Use HTTP status code instead of comparing message
      if (res.status === 200) {
        console.log('Google login successful:', res.data);

        setSuccess('Logged in with Google successfully!');
        const user = res.data.data || res.data.user;
        dispatch(setUser(user));
        if (user.role === 'ADMIN') {
          navigate('/admin-portal');
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
      onError={() => setError('Google login failed')}
    />
  );
}
