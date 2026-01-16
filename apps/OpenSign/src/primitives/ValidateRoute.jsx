import React, { useEffect } from "react";
import authService from "../services/authService";
import userService from "../services/userService";
import { Outlet } from "react-router";
import { saveLanguageInLocal } from "../constant/Utils";
import { useTranslation } from "react-i18next";
const ValidateRoute = () => {
  const { i18n } = useTranslation();
  useEffect(() => {
    (async () => {
      if (localStorage.getItem("accesstoken")) {
        try {
          // Validate user with JWT token
          const user = await authService.getCurrentUser();
          if (!user) {
            handlelogout();
          }
        } catch (error) {
          console.log("err in validate route", error);
          handlelogout();
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handlelogout = async () => {
    let appdata = localStorage.getItem("userSettings");
    let applogo = localStorage.getItem("appLogo");
    let defaultmenuid = localStorage.getItem("defaultmenuid");
    let PageLanding = localStorage.getItem("PageLanding");
    let baseUrl = localStorage.getItem("baseUrl");
    let appid = localStorage.getItem("parseAppId");
    let favicon = localStorage.getItem("favicon");

    localStorage.clear();
    saveLanguageInLocal(i18n);

    localStorage.setItem("appLogo", applogo);
    localStorage.setItem("defaultmenuid", defaultmenuid);
    localStorage.setItem("PageLanding", PageLanding);
    localStorage.setItem("userSettings", appdata);
    localStorage.setItem("baseUrl", baseUrl);
    localStorage.setItem("parseAppId", appid);
    localStorage.setItem("favicon", favicon);
  };
  return <>{<Outlet />}</>;
};

export default ValidateRoute;
