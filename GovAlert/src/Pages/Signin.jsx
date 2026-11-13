import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import welcome from "../assets/welcome.jpg";
import { API_URL, saveSession, COMMUNITY_URL } from "../auth";
import GoogleButton, { OrDivider } from "../components/GoogleButton";
import { useToast } from "../components/Toaster";

function Signin() {
  const [mode, setMode] = useState("user"); // "user" or "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const isAdmin = mode === "admin";

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}${isAdmin ? "/admin/login" : "/login"}`, {
        email: email.trim(),
        password,
      });
      saveSession(data);
      toast.success(`Welcome back, ${data.user.username}!`, isAdmin ? "Signed in to the admin dashboard." : "You're signed in.");
      navigate(isAdmin ? "/admin" : "/homeIn");
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        toast.info("Verify your email", "We've sent a verification code to your inbox.");
        return navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
          state: { message: data.message, devMode: data.devMode },
        });
      }
      if (err.response) setError(data?.message || "Invalid email or password");
      else if (err.request) setError("Cannot connect to server. Please try again.");
      else setError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };
function report(event) {
  event.preventDefault();
  toast.info("Sign in required", "Please sign in below to report an issue.");
}
  return (
    <div
    style={{
      backgroundImage: `url(${welcome})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      height: "100vh",
    }}
    className="flex items-center justify-center bg-opacity-90"
  >
    <div className=" text-gray-200 flex flex-col min-h-screen w-screen h-screen overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-800 p-4 shadow-lg flex justify-between items-center sticky top-0 z-50 w-full">
        <div className="flex items-center space-x-8">
          <a href="/" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-home"></i><span>Home</span>
          </a>
          <a href="/login" onClick={report} className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-flag"></i><span>Report</span>
          </a>
          {/* <a href="#phone" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-phone"></i><span>Contact</span>
          </a>
          <a href="#help" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-question-circle"></i><span>Help</span> 
          </a>*/}
          <a href={`${COMMUNITY_URL}/about`} className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-info-circle"></i><span>About Us</span>
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex items-center justify-center flex-grow w-full h-full">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          {/* User / Admin toggle */}
          <div className="flex mb-6 bg-gray-900 rounded-lg p-1">
            {["user", "admin"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                  mode === m ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <i className={`fa ${m === "admin" ? "fa-user-shield" : "fa-user"} mr-2`}></i>
                {m === "admin" ? "Admin" : "User"}
              </button>
            ))}
          </div>
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">
            {isAdmin ? "Admin Sign In" : "Sign In"}
          </h2>
          {error && <p className="mb-4 text-center text-red-400">{error}</p>}
          <form onSubmit={handleSignIn}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-300">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder={isAdmin ? "Admin email" : "Email"}
                autoComplete="email"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-300 bg-gray-900"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-300">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-300 bg-gray-900"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Signing in..." : isAdmin ? "Sign In as Admin" : "Sign In"}
            </button>
          </form>
          {!isAdmin && (
            <>
              <OrDivider />
              <GoogleButton text="signin_with" />
            </>
          )}
          {isAdmin ? (
            <p className="mt-4 text-center text-gray-400 text-sm">
              Admin accounts are issued by the platform. Contact your administrator for access.
            </p>
          ) : (
            <p className="mt-4 text-center text-gray-400">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-500 hover:underline">
                Sign Up
              </Link>
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 bg-gray-800 text-gray-400 w-full">
        &copy; 2024 GovAlert. All Rights Reserved.
      </footer>
    </div>
    </div>
  );
}

export default Signin;