import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { API_URL, saveSession } from "../auth";
import { useToast } from "./Toaster";

// The Google client ID lives in Backend/.env (GOOGLE_CLIENT_ID); fetch it once
let configPromise;
const loadConfig = () => {
  configPromise ||= axios.get(`${API_URL}/auth/config`).then((r) => r.data).catch(() => ({}));
  return configPromise;
};

// "Continue with Google" button - signs in, or creates an account on first use
function GoogleButton({ text = "continue_with" }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [clientId, setClientId] = useState(undefined); // undefined = loading, null = not configured
  const [error, setError] = useState("");

  useEffect(() => {
    loadConfig().then((c) => setClientId(c.googleClientId || null));
  }, []);

  if (clientId === undefined) return null;
  if (!clientId) {
    return <p className="text-gray-500 text-xs text-center">Google sign-in is not set up yet.</p>;
  }

  const onSuccess = async ({ credential }) => {
    setError("");
    try {
      const { data } = await axios.post(`${API_URL}/auth/google`, { credential });
      saveSession(data);
      toast.success(`Welcome, ${data.user.username}!`, "You're signed in with Google.");
      navigate(data.user.role === "admin" ? "/admin" : "/homeIn");
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed. Please try again.");
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={() => setError("Google sign-in was cancelled or failed.")}
          text={text}
          theme="filled_black"
          shape="pill"
          width="300"
        />
      </div>
      {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
    </GoogleOAuthProvider>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center my-5">
      <div className="flex-grow border-t border-gray-600"></div>
      <span className="px-3 text-gray-400 text-sm">or</span>
      <div className="flex-grow border-t border-gray-600"></div>
    </div>
  );
}

export default GoogleButton;
