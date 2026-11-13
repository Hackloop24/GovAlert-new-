import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase/setup";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type emailType = {
  setEmailSignup: any;
};

const EmailSignup = (props: emailType) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const Signup = async () => {
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password should be at least 6 characters.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        toast.success("Sign-up successful! Please verify your email.");
        props.setEmailSignup(false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email is already in use.");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else {
        toast.error("Error creating account. Please try again.");
      }
    }
  };

  return (
    <>
      <ToastContainer autoClose={3000} />
      <div className="relative z-10" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-zinc-950 bg-opacity-80 transition-opacity"></div>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-6/12">
              <div className="bg-white pb-4 pt-5 sm:p-6 sm:pb-4">
                <div>
                  <h1
                    className="cursor-pointer"
                    onClick={() => props.setEmailSignup(false)}
                  >
                    X
                  </h1>
                  <h1 className="mt-3 font-semibold text-lg">Sign up</h1>
                  <label className="mt-3 text-sm font-semibold">
                    Email
                    <input
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your Email"
                      className="mt-3 outline-blue-400 border p-2 w-full rounded-md"
                    />
                  </label>
                  <label className="mt-3 text-sm font-semibold">
                    Password
                    <input
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      placeholder="Your Password"
                      className="mt-3 outline-blue-400 border p-2 w-full rounded-md"
                    />
                  </label>
                </div>
                <button
                  onClick={Signup}
                  className="bg-blue-500 text-white rounded-full p-2 w-20 mt-5"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailSignup;
