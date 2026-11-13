import { Link } from "react-router-dom"; // Import Link from react-router-dom
import community from "../assets/community.jpeg";
import lens from "../assets/search.png";
import Avatar from "react-avatar";
import PostPopup from "./PostPopup";
import { useState } from "react";
// The GovAlert app runs separately, so links to it are plain <a> tags
import { BASE, GOVALERT_URL } from "../config";
type SearchProp = {
  setSearch: (value: string) => void;
};

const Navbar = (props: SearchProp) => {
  const [post, setPost] = useState(false);

  return (
    <nav className="flex items-center justify-between px-8 py-3 bg-gray-800 shadow-md w-full h-16 text-gray-200">
      {/* Left Section: Logo */}
      <div className="flex items-center gap-4">
        <img
          src={community}
          alt="Community Logo"
          className="w-12 h-12 rounded-full border border-gray-300"
        />
        <h1 className="text-3xl font-extrabold text-blue-500 tracking-wide">
          GovAlert
        </h1>
      </div>

      
      <div className="flex items-center gap-8">
  
        <div className="flex gap-6">
          <a
            href={`${GOVALERT_URL}/homeIn`}
            className="flex items-center space-x-1 text-gray-300 hover:text-blue-400"
          >
            <i className="fa fa-th-large"></i><span>Main</span>
          </a>
          <a
            href={`${BASE}main`}
            className="flex items-center space-x-1 text-gray-300 hover:text-blue-400"
          >
            <i className="fa fa-home"></i><span>Home</span>
          </a>
          <a
            href={`${GOVALERT_URL}/report`}
            className="flex items-center space-x-1 text-gray-300 hover:text-blue-400"
          >
            <i className="fa fa-flag"></i><span>Report</span>
          </a>
          
          {/* <a
            href="#phone"
            className="flex items-center space-x-1 text-gray-300 hover:text-blue-400" 
          >
            <i className="fa fa-phone"></i><span>Contact</span>
          </a>
          <a
            href="#help"
            className="flex items-center space-x-1 text-gray-300 hover:text-blue-400"
          >
            <i className="fa fa-question-circle"></i><span>Help</span>
          </a> */}
          <Link
            to="/about"
            className="flex items-center space-x-1 text-gray-300 hover:text-blue-400"
          >
            <i className="fa fa-info-circle"></i><span>About Us</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-1 w-80 bg-gray-700">
          <img src={lens} alt="Search Icon" className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => props.setSearch(e.target.value)}
            className="ml-2 w-full outline-none text-sm placeholder-gray-500 bg-gray-700 text-gray-200"
          />
        </div>
      </div>

      {/* Right Section: Avatar and Add Question Button */}
      <div className="flex items-center gap-4">
        <Avatar
          round
          size="30"
          name="Your Name"
          className="cursor-pointer"
        />
        <button
          onClick={() => setPost(true)}
          className="bg-blue-500 text-white rounded-full px-4 py-2 text-sm hover:bg-blue-600 transition-colors"
        >
          Add Question
        </button>
      </div>

      {/* Post Popup */}
      {post && <PostPopup setPost={setPost} />}
    </nav>
  );
};

export default Navbar;
