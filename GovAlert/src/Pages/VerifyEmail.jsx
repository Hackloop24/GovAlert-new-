import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import welcome from "../assets/welcome.jpg";
import { API_URL, saveSession } from "../auth";
import { useToast } from "../components/Toaster";

const RESEND_SECONDS = 60;

function VerifyEmail() {
  const navigate = useNavigate();
  const toast = useToast();
  const { state } = useLocation();
  const [params] = useSearchParams();
  const email = params.get("email") || "";

  const [code, setCode] = useState("");
  const [info, setInfo] = useState(state?.message || `We've sent a 6-digit code to ${email}.`);
  const [devMode, setDevMode] = useState(Boolean(state?.devMode));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!email) return <Navigate to="/signup" replace />;

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from the email.");
    setBusy(true);
    try {
      const { data } = await axios.post(`${API_URL}/verify-email`, { email, code });
      saveSession(data);
      toast.success("Email verified!", `Welcome to GovAlert, ${data.user.username}.`);
      navigate("/homeIn");
    } catch (err) {
      setError(err.response?.data?.message || "Cannot connect to server. Please try again.");
      if (err.response?.data?.expired) setCode("");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    try {
      const { data } = await axios.post(`${API_URL}/resend-verification`, { email });
      setInfo(data.message);
      setDevMode(Boolean(data.devMode));
      setCode("");
      setCooldown(RESEND_SECONDS);
      toast.success("New code sent", `Check ${email} for your new 6-digit code.`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend the code.");
      if (err.response?.data?.retryAfter) setCooldown(err.response.data.retryAfter);
    }
  };

  return (
    <div
      style={{ backgroundImage: `url(${welcome})`, backgroundRepeat: "no-repeat", backgroundSize: "cover" }}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="bg-gray-800 text-gray-200 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <i className="fa-solid fa-envelope-circle-check text-blue-400 text-5xl mb-4"></i>
        <h2 className="text-2xl font-bold text-blue-400 mb-2">Verify your email</h2>
        <p className="text-gray-300 mb-1">{info}</p>
        <p className="text-gray-500 text-sm mb-6">Check your inbox (and spam folder). The code expires in 10 minutes.</p>

        {devMode && (
          <p className="text-yellow-300 text-sm bg-gray-900 rounded-md p-2 mb-4">
            Email sending isn't configured yet, so the code was printed in the backend terminal.
          </p>
        )}

        <form onSubmit={verify}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="------"
            className="w-full text-center text-3xl tracking-widest px-3 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-blue-500 mb-4"
            style={{ letterSpacing: "0.5em" }}
          />
          {error && <p className="text-red-400 mb-4">{error}</p>}
          <button type="submit" disabled={busy}
                  className={`w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 ${busy ? "opacity-50" : ""}`}>
            {busy ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <p className="mt-4 text-gray-400 text-sm">
          Didn't get the code?{" "}
          {cooldown > 0 ? (
            <span className="text-gray-500">Resend in {cooldown}s</span>
          ) : (
            <button onClick={resend} className="text-blue-400 hover:underline">Resend code</button>
          )}
        </p>
        <p className="mt-2 text-gray-500 text-sm">
          Wrong email? <Link to="/signup" className="text-blue-400 hover:underline">Sign up again</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;
