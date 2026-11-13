import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import welcome from "../assets/welcome.jpg";
import { API_URL, COMMUNITY_URL } from "../auth";
import GoogleButton, { OrDivider } from "../components/GoogleButton";

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8 || password.length > 72) return setError('Password must be 8 to 72 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/register`, {
        username: username.trim(),
        email: email.trim(),
        password,
      });
      // account created but not active until the emailed code is entered
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
        state: { message: data.message, devMode: data.devMode },
      });
    } catch (err) {
      if (err.response) setError(err.response.data?.message || 'An error occurred during sign-up.');
      else setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${welcome})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        height: "100vh",
      }}
      className="flex items-center justify-center"
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      <div className="relative text-gray-200 flex flex-col min-h-screen w-screen h-screen overflow-hidden">
        {/* Top Navigation Bar */}
        <nav className="bg-gray-800 p-4 shadow-lg flex justify-between items-center sticky top-0 z-50 w-full">
          <div className="flex items-center space-x-8">
            <a href="/" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
              <i className="fa fa-home"></i><span>Home</span>
            </a>
            <a href="/login" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
              <i className="fa fa-flag"></i><span>Report</span>
            </a>
            {/* <a href="#phone" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
              <i className="fa fa-phone"></i><span>Contact</span>
            </a>
            <a href="#help" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
              <i className="fa fa-question-circle"></i><span>Help</span>
            </a> */}
            <a href={`${COMMUNITY_URL}/about`} className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
              <i className="fa fa-info-circle"></i><span>About Us</span>
            </a>
          </div>
        </nav>

        <div className="min-h-screen w-screen flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold text-blue-400 text-center mb-6">Sign Up</h2>
            {error && <p className="mb-4 text-center text-red-400">{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-gray-300">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 text-gray-300 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-300">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-gray-300 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-300">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  className="w-full px-3 py-2 text-gray-300 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-gray-300">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 text-gray-300 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
            <OrDivider />
            <GoogleButton text="signup_with" />
            <p className="mt-4 text-center text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
