import React from 'react';
import { COMMUNITY_URL } from "../auth";
import { Link, useNavigate } from "react-router-dom";
import FeatureCards from "../components/FeatureCards";
import { useToast } from "../components/Toaster";


  function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const ruko=(event)=>{
    event?.preventDefault();
    toast.info("Sign in required", "Please sign in or create an account to report an issue.");
    navigate("/login");
  }

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen w-full flex flex-col">
      {/* Top Navigation Bar (From Old Version) */}
      <nav className="bg-gray-800 p-4 shadow-lg flex justify-between items-center w-full sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="flex items-center space-x-1 text-gray-300 hover:text-blue-400"
          >
            <i className="fa fa-home"></i><span>Home</span>
          </Link>
          <Link to="/login" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400" onClick={ruko}>
            <i className="fa fa-flag"></i><span>Report</span>
          </Link>
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

        <div className="flex items-center space-x-4">
          <a href="/login" className="text-blue-400 hover:text-blue-500">
            Sign In
          </a>
          <a href="/signup" className="text-blue-400 hover:text-blue-500">
            Sign Up
          </a>
        </div>
      </nav>

      {/* Website Header (From Old Version) */}
      <header className="text-center py-8 bg-gray-900 w-full">
        <h1 className="text-4xl font-bold text-blue-400 typing-animation">
          Grievance Redressal Platform
        </h1>
        <p className="text-gray-400 mt-2 text-base">
          A transparent platform for residents to report issues and monitor their resolution.
        </p>
      </header>

      {/* Main Content (From New Version) */}
      <main className="w-full flex-grow flex flex-col items-center justify-center px-4 py-8">
        <h2 className="text-4xl font-bold mb-8 text-blue-400">Welcome to GovAlert</h2>
        <p className="text-gray-400 mb-12 text-base text-center">
          Facilitating communication between citizens and local governments. Report community issues directly and track their progress.
        </p>

        <FeatureCards />
      </main>

      {/* Footer */}
      <footer className="text-center py-4 bg-gray-800 text-gray-400 text-base w-full">
        &copy; 2024 Grievance Redressal Platform. All Rights Reserved.
      </footer>
    </div>
  );
}

export default Home;
