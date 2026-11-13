import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { COMMUNITY_URL, clearSession, getSession } from "../auth";
import { useToast } from "./Toaster";

// Top navigation used by the feature pages; adapts to whether someone is signed in
function NavBar() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = getSession()?.user;

  const links = [
    { to: user ? "/homeIn" : "/", icon: "fa-house", label: "Home" },
    { to: user ? "/report" : "/login", icon: "fa-bullhorn", label: "Report" },
    { to: "/track", icon: "fa-list-check", label: "Track" },
    { to: "/map", icon: "fa-location-dot", label: "Map" },
    { to: "/responses", icon: "fa-comments", label: "Responses" },
    { to: "/transparency", icon: "fa-shield-halved", label: "Transparency" },
  ];

  const logout = async () => {
    const ok = await toast.confirm({
      title: "Log out?",
      message: "You'll need to sign in again to report or track issues.",
      confirmText: "Log out",
      icon: "fa-right-from-bracket",
    });
    if (!ok) return;
    clearSession();
    toast.success("Logged out", "See you again soon.");
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center space-x-1 ${isActive ? "text-blue-400" : "text-gray-300 hover:text-blue-400"}`;

  return (
    <nav className="bg-gray-800 px-4 py-3 shadow-lg w-full sticky top-0 z-50 flex flex-wrap justify-between items-center gap-3"
         style={{ zIndex: 1000 }}>
      <div className="flex flex-wrap items-center gap-5">
        {links.map((l) => (
          <NavLink key={l.label} to={l.to} end className={linkClass}>
            <i className={`fa-solid ${l.icon}`}></i>
            <span>{l.label}</span>
          </NavLink>
        ))}
        <a href={COMMUNITY_URL} className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
          <i className="fa-solid fa-users"></i>
          <span>Community</span>
        </a>
        <a href={`${COMMUNITY_URL}/about`} className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
          <i className="fa-solid fa-circle-info"></i>
          <span>About Us</span>
        </a>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {user.role === "admin" && (
              <NavLink to="/admin" className={linkClass}>
                <i className="fa-solid fa-user-shield"></i>
                <span>Admin</span>
              </NavLink>
            )}
            <span className="text-gray-400 text-sm">{user.username}</span>
            <button
              onClick={logout}
              className="text-blue-400 hover:text-blue-300 px-3 py-1 rounded-lg border border-blue-400"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="text-blue-400 hover:text-blue-300">Sign In</NavLink>
            <NavLink to="/signup" className="text-blue-400 hover:text-blue-300">Sign Up</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
