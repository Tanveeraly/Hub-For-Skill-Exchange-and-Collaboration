import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import axios from 'axios';

const GoogleLoginPage: React.FC = () => {
  const handleLogin = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        console.error('No credential returned from Google.');
        return;
      }

      const token = credentialResponse.credential;

      const res = await axios.post(
        'http://localhost:5000/api/v1/auth/social-login',
        { token },
        { withCredentials: true } // send cookies
      );

      console.log('Login success:', res.data);
    } catch (err: any) {
      console.error('Login error:', err.response || err.message || err);
    }
  };

  return (
    <div style={{ margin: '100px', textAlign: 'center' }}>
      <h1>Google Login Page</h1>
      <GoogleLogin 
        onSuccess={handleLogin} 
        onError={() => console.error('Google login failed')} 
      />
    </div>
  );
};

export default GoogleLoginPage;
