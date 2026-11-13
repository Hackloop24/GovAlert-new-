import welcome from "../assets/welcome.jpg";
import google from "../assets/google.png";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/setup";
import { useNavigate } from "react-router-dom";
import { BASE, GOVALERT_URL } from "../config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Signup = () => {
  const navigate = useNavigate();

  // Google Sign-In Handler
  const googleSignin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        toast.success("Signed up successfully");
        setTimeout(() => {
          navigate("/main"); // Navigate to main page after successful signup
        }, 2000);
      }
    } catch (err) {
      console.error("Google sign-in error: ", err);
      toast.error("Error signing up with Google");
    }
  };

  return (
    <>
     <nav className="bg-gray-800 p-4 shadow-lg flex justify-between items-center sticky top-0 z-50 w-full">
        <div className="flex items-center space-x-8">
          <a href={`${GOVALERT_URL}/`} className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-home"></i><span>Home</span>
          </a>
          <a href={`${GOVALERT_URL}/login`} className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-flag"></i><span>Report</span>
          </a>
          <a href={`${BASE}about`} className="flex items-center space-x-1 text-gray-300 hover:text-blue-400">
            <i className="fa fa-info-circle"></i><span>About Us</span>
          </a>
        </div>
      </nav>
      <ToastContainer autoClose={3000} />
      <div
        style={{
          backgroundImage: `url(${welcome})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          height: "100vh",
        }}
        className="flex items-center justify-center bg-opacity-90"
      >
        <div className="bg-gray-800 h-11/12 w-7/12 rounded-md p-8 shadow-xl text-white">
          <h1 className="text-blue-400 text-6xl font-bold font-sans text-center">
            GovAlert
          </h1>
          <h2 className="text-center font-medium text-gray-400 mt-3">
            A place to solve issues
          </h2>
          <div className="flex justify-center mt-10">
            <div>
              <p className="text-gray-400 text-sm w-72 text-center">
                By continuing, you indicate that you agree to GovAlert’s{" "}
                <span className="text-blue-400 cursor-pointer">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-blue-400 cursor-pointer">
                  Privacy Policy.
                </span>
              </p>
              <div
                onClick={googleSignin}
                className="cursor-pointer flex p-3 border border-gray-600 items-center w-80 rounded-md mt-5 hover:bg-gray-700"
              >
                <img src={google} className="w-5 h-5 ml-2" alt="Google Logo" />
                <p className="ml-7">Sign up with Google</p>
              </div>
            </div>
          </div>
          <hr className="mt-6 border-gray-600" />
          <p className="text-sm text-center mt-3 text-gray-400">
            About . Careers . Privacy . Terms . Contact . Languages . Your Ad
            Choices . Press© GovAlert, Inc. 2024
          </p>
        </div>
      </div>
    </>
  );
};

export default Signup;
