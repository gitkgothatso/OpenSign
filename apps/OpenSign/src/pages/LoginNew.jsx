import { useEffect, useState } from "react";
import { authService } from "../services";
import { useDispatch } from "react-redux";
import { NavLink, useNavigate, useLocation } from "react-router";
import login_img from "../assets/images/login_img.svg";
import { useWindowSize } from "../hook/useWindowSize";
import ModalUi from "../primitives/ModalUi";
import { emailRegex } from "../constant/const";
import Alert from "../primitives/Alert";
import { appInfo } from "../constant/appinfo";
import { fetchAppInfo } from "../redux/reducers/infoReducer";
import { showTenant } from "../redux/reducers/ShowTenant";
import {
  getAppLogo,
  saveLanguageInLocal,
  usertimezone
} from "../constant/Utils";
import Loader from "../primitives/Loader";
import { useTranslation } from "react-i18next";
import SelectLanguage from "../components/pdf/SelectLanguage";

function LoginNew() {
  const appName = "OpenSign™";
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { width } = useWindowSize();
  
  const [state, setState] = useState({
    email: "",
    password: "",
    alertType: "success",
    alertMsg: "",
    passwordVisible: false,
    loading: false,
    thirdpartyLoader: false,
  });
  
  const [userDetails, setUserDetails] = useState({
    Company: "",
    Destination: ""
  });
  
  const [isModal, setIsModal] = useState(false);
  const [image, setImage] = useState();
  const [errMsg, setErrMsg] = useState();

  useEffect(() => {
    handleUserExist();
    // eslint-disable-next-line
  }, []);

  const handleUserExist = async () => {
    checkUserExt();
  };

  const setLocalVar = (user) => {
    // Store JWT token and user information
    if (user.jwtToken) {
      localStorage.setItem("accesstoken", user.jwtToken);
    }
    localStorage.setItem("UserInformation", JSON.stringify(user));
    localStorage.setItem("userEmail", user.email);
    if (user.profilePic) {
      localStorage.setItem("profileImg", user.profilePic);
    } else {
      localStorage.setItem("profileImg", "");
    }
  };

  const showToast = (type, msg) => {
    setState(prev => ({ ...prev, loading: false, alertType: type, alertMsg: msg }));
    setTimeout(() => setState(prev => ({ ...prev, alertMsg: "" })), 2000);
  };

  const checkUserExt = async () => {
    const app = await getAppLogo();
    if (app?.error === "invalid_json") {
      setErrMsg(t("server-down", { appName: appName }));
      return;
    }
    
    setImage(app);
    
    // Check if user is already logged in via JWT
    const token = authService.getToken();
    if (token && authService.isAuthenticated()) {
      try {
        // Verify token is still valid by fetching current user
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setLocalVar(currentUser);
          navigate("/");
          return;
        }
      } catch (error) {
        // Token invalid or expired, continue to login
        authService.logout();
      }
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState(prev => ({ ...prev, loading: true, alertMsg: "" }));

    const { email, password } = state;

    // Basic validation
    if (!email || !password) {
      showToast("danger", t("email-required-alert"));
      return;
    }

    if (!emailRegex.test(email)) {
      showToast("danger", t("enter-valid-email"));
      return;
    }

    try {
      // Call new backend authentication service
      const response = await authService.login(email, password);
      
      // Store user data
      const userData = {
        userId: response.userId,
        username: response.username,
        email: response.email,
        jwtToken: response.jwtToken,
        // Map additional fields as needed
        objectId: response.userId,
        sessionToken: response.jwtToken, // For backward compatibility
      };

      setLocalVar(userData);
      
      // Dispatch Redux actions
      dispatch(fetchAppInfo());
      dispatch(showTenant());

      // Set language and timezone
      const lng = localStorage.getItem("lang") || "en";
      await saveLanguageInLocal(lng, i18n);
      
      const appTimezone = usertimezone();
      localStorage.setItem("userTimeZone", appTimezone);

      showToast("success", t("login-successful"));
      
      // Navigate to intended page or dashboard
      const from = location.state?.from?.pathname || "/";
      setTimeout(() => navigate(from), 1000);

    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = t("login-failed");
      
      if (error.response?.status === 401) {
        errorMessage = t("invalid-credentials");
      } else if (error.response?.status === 429) {
        errorMessage = t("too-many-requests");
      } else if (error.message === "Network Error") {
        errorMessage = t("network-error");
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast("danger", errorMessage);
    }
  };

  const handleUserData = (event) => {
    const { name, value } = event.target;
    setUserDetails(prev => ({ ...prev, [name]: value }));
  };

  const thirdpartySignin = async (e) => {
    e.preventDefault();
    setState(prev => ({ ...prev, thirdpartyLoader: true }));
    // Third party login implementation
    // This would need to be updated based on your OAuth/SSO requirements
  };

  const togglePasswordVisibility = () => {
    setState(prev => ({ ...prev, passwordVisible: !prev.passwordVisible }));
  };

  if (errMsg) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{t("error")}</h2>
          <p className="text-gray-600">{errMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left side - Image (hidden on mobile) */}
      {width >= 768 && (
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center p-10">
          <img src={login_img} alt="Login" className="max-w-md" />
        </div>
      )}

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          {image && (
            <div className="text-center mb-8">
              <img 
                src={image} 
                alt={appName} 
                className="mx-auto h-16 mb-4"
              />
            </div>
          )}

          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            {t("welcome-back")}
          </h2>
          <p className="text-center text-gray-600 mb-8">
            {t("login-to-continue")}
          </p>

          {/* Alert */}
          {state.alertMsg && (
            <Alert type={state.alertType}>
              {state.alertMsg}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("email")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={state.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t("enter-email")}
                disabled={state.loading}
                required
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("password")}
              </label>
              <div className="relative">
                <input
                  type={state.passwordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  value={state.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("enter-password")}
                  disabled={state.loading}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {state.passwordVisible ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  {t("remember-me")}
                </label>
              </div>
              <NavLink 
                to="/forgetpassword" 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {t("forgot-password")}
              </NavLink>
            </div>

            <button
              type="submit"
              disabled={state.loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.loading ? (
                <Loader />
              ) : (
                t("login")
              )}
            </button>
          </form>

          {/* Language Selector */}
          <div className="mt-6">
            <SelectLanguage />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 mt-6">
            {t("dont-have-account")}{" "}
            <NavLink 
              to="/signup" 
              className="text-blue-600 font-semibold hover:text-blue-800"
            >
              {t("sign-up")}
            </NavLink>
          </p>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Powered by {appName}
          </p>
        </div>
      </div>

      {/* Modal for additional user details (if needed) */}
      {isModal && (
        <ModalUi
          isOpen={isModal}
          onClose={() => setIsModal(false)}
          title={t("complete-profile")}
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("company")}
              </label>
              <input
                type="text"
                name="Company"
                value={userDetails.Company}
                onChange={handleUserData}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder={t("enter-company")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("job-title")}
              </label>
              <input
                type="text"
                name="Destination"
                value={userDetails.Destination}
                onChange={handleUserData}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder={t("enter-job-title")}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              {t("continue")}
            </button>
          </form>
        </ModalUi>
      )}
    </div>
  );
}

export default LoginNew;
