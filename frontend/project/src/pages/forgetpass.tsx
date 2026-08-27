import React, { useState } from "react";
import axios from "axios";

const ForgotPass: React.FC = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5000/api/v1/auth/forgot-passwordd", {
        email,
        newPassword,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setMessage(res.data.message || "Password reset successful!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center", marginTop: "0" }}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px",  marginTop: "100px" ,borderColor: "blank" , borderWidth: "2px",borderRadius: "5px"}}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", borderColor: "blank" , borderWidth: "2px"}}
          />
        </div>
        <button type="submit" style={{ padding: "10px 20px",  color:"blue", fontWeight:"bold" }}>
          Reset Password
        </button>
      </form>
      {message && <p style={{ marginTop: "15px" }}>{message}</p>}
    </div>
  );
};

export default ForgotPass;
