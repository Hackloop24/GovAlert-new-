import React from 'react';
import { useNavigate } from "react-router-dom";
import { clearSession, getSession, COMMUNITY_URL } from "../auth";
import FeatureCards from "../components/FeatureCards";
import { useToast } from "../components/Toaster";

function Home2() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = getSession()?.user;

  const handleLogout = async () => {
    const ok = await toast.confirm({
      title: "Log out?",
      message: "You'll need to sign in again to report or track issues.",
      confirmText: "Log out",
      icon: "fa-right-from-bracket",
    });
    if (!ok) return;
    clearSession();
    toast.success("Logged out", "See you again soon.");
    navigate("/");  // go to the Home page after logout
  };
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen w-full flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-800 p-4 shadow-lg flex justify-between items-center w-full sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <a href="/homeIn" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-home"></i><span>Home</span>
          </a>
          <a href="/report" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-flag"></i><span>Report</span>
          </a>
          <a href="/fund" className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-flag"></i><span>Allocated Funds</span>
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

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="text-blue-400 hover:text-blue-500 px-4 py-2 rounded-lg border border-blue-400 hover:bg-gray-700 transition duration-300"
        >
          Logout
        </button>
      </nav>

      {/* Website Header */}
      <header className="text-center py-8 bg-gray-900 w-full">
        <h1 className="text-4xl font-bold text-blue-400 typing-animation">
          Grievance Redressal Platform
        </h1>
        <p className="text-gray-400 mt-2 text-base">
          A transparent platform for residents to report issues and monitor their resolution.
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full flex-grow flex flex-col items-center justify-center px-4 py-8">
        <h2 className="text-4xl font-bold mb-8 text-blue-400">
          Welcome to GovAlert{user ? `, ${user.username}` : ""}
        </h2>
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

export default Home2;
