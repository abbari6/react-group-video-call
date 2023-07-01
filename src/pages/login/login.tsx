import React, { useState } from 'react';
import axios from 'axios';
import './login.css'
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleUsernameChange = (event: any) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: any) => {
    setPassword(event.target.value);
  };

  const handleLogin = () => {
    axios
      .post('http://localhost:3001/api/v1/auth/email/login', { email, password })
      .then((response:any) => {
        // Save the response in local storage
        localStorage.setItem('token', response.data.token);
        navigate('/Scenario');
        // You can redirect to another page or perform any other action here
      })
      .catch((error:any) => {
        console.error('Error logging in:', error);
      });
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={email}
            onChange={handleUsernameChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
          />
        </div>
        <button type="button" onClick={handleLogin}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;