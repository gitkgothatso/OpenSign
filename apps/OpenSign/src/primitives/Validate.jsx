import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import SessionExpiredModal from "./SessionExpiredModal";
import authService from "../services/authService";

const Validate = () => {
  const [isUserValid, setIsUserValid] = useState(true);
  
  useEffect(() => {
    (async () => {
      // Check if user has JWT token
      const jwtToken = localStorage.getItem("jwtToken");
      
      if (jwtToken) {
        // JWT token exists, user is valid
        setIsUserValid(true);
      } else {
        // No JWT token, check if there's an old Parse session to convert
        const accessToken = localStorage.getItem("accesstoken");
        if (accessToken) {
          try {
            // Try to convert old Parse session to JWT
            await authService.convertSession(accessToken);
            setIsUserValid(true);
          } catch (error) {
            console.error("Session conversion failed:", error);
            setIsUserValid(false);
          }
        } else {
          // No tokens at all, session expired
          setIsUserValid(false);
        }
      }
    })();
  }, []);

  return isUserValid ? <Outlet /> : <SessionExpiredModal />;
};

export default Validate;
