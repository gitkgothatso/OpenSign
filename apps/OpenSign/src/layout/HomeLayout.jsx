import { useState, useEffect } from "react";
import {
  nonPresentMaskCss
} from "../constant/Utils";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/sidebar/Sidebar";
import Tour from "../primitives/Tour";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import Parse from "parse";
import {
  Outlet
} from "react-router";
import Loader from "../primitives/Loader";
import { useTranslation } from "react-i18next";
import { sessionStatus } from "../redux/reducers/userReducer";
import SessionExpiredModal from "../primitives/SessionExpiredModal";
import userService from "../services/userService";

const HomeLayout = () => {
  const appName =
    "OpenSign™";
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const tourArr = useSelector((state) => state.TourSteps);
  const isValidSession = useSelector((state) => state.user.isValidSession);
  const [isLoader, setIsLoader] = useState(true);
  const [isCloseBtn, setIsCloseBtn] = useState(true);
  const [isTour, setIsTour] = useState(false);
  const [tourStatusArr, setTourStatusArr] = useState([]);
  const [tourConfigs, setTourConfigs] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const tenantId = localStorage.getItem("TenantId");

  useEffect(() => {
    const language = localStorage.getItem("i18nextLng");
    i18n.changeLanguage(language);
    localStorage.setItem("isGuestSigner", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Check for JWT token instead of Parse accesstoken
    const jwtToken = localStorage.getItem("jwtToken");
    
    if (jwtToken) {
      // JWT token exists, user is valid
      dispatch(sessionStatus(true));
      setIsLoader(false);
    } else {
      // No JWT token, check for old Parse session to convert
      const accesstoken = localStorage.getItem("accesstoken");
      if (accesstoken && tenantId) {
        // User has old Parse session with tenantId, try to convert it
        console.log("Old Parse session detected, please log in again");
        dispatch(sessionStatus(false));
      } else if (!accesstoken) {
        // No session at all
        dispatch(sessionStatus(false));
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);


  useEffect(() => {
    if (tourArr && tourArr.length > 0) {
      handleDynamicSteps();
    } else {
      setIsTour(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourArr]);

  const handleDynamicSteps = () => {
    const github = "https://github.com/OpenSignLabs/OpenSign";
    if (tourArr && tourArr.length > 0) {
      const resArr = tourArr.map((obj, index) => {
        if (tourArr.length - 1 === index) {
          return obj;
        } else {
          return { ...obj, actions: () => setIsCloseBtn(false) };
        }
      });
      setTourConfigs([
        {
          selector: '[data-tut="nonpresentmask"]',
          content: t("tour-mssg.home-layout-1"),
          position: "center",
          styles: { fontSize: "13px", maskArea: nonPresentMaskCss }
        },
        {
          selector: '[data-tut="tourbutton"]',
          content: t("tour-mssg.home-layout-2"),
          position: "top",
          styles: { fontSize: "13px" }
        },
        ...resArr,
        {
          selector: '[data-tut="nonpresentmask"]',
          content: () => (
            <div>
              {t("tour-mssg.home-layout-3", { appName })}
              <p className="mt-[3px]">
                ⭐ Star us on
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium pl-1 cursor-pointer"
                >
                  GitHub
                </a>
              </p>
            </div>
          ),
          position: "center",
          styles: { fontSize: "13px", maskArea: nonPresentMaskCss }
        }
      ]);
      checkTourStatus();
    }
  };
  const closeTour = async () => {
    setIsTour(false);
    const serverUrl = localStorage.getItem("baseUrl");
    const appId = localStorage.getItem("parseAppId");
    const json = JSON.parse(localStorage.getItem("Extand_Class"));
    const extUserId = json && json.length > 0 && json[0].objectId;

    let updatedTourStatus = [];
    if (tourStatusArr.length > 0) {
      updatedTourStatus = [...tourStatusArr];
      const loginTourIndex = tourStatusArr.findIndex(
        (obj) => obj["loginTour"] === false || obj["loginTour"] === true
      );
      if (loginTourIndex !== -1) {
        updatedTourStatus[loginTourIndex] = { loginTour: true };
      } else {
        updatedTourStatus.push({ loginTour: true });
      }
    } else {
      updatedTourStatus = [{ loginTour: true }];
    }

    // TODO: Migrate to REST API - POST /api/v1/users/{userId}/tour-status
    try {
      await axios.put(
        serverUrl + "classes/contracts_Users/" + extUserId,
        { TourStatus: updatedTourStatus },
        { headers: { "X-Parse-Application-Id": appId } }
      );
    } catch (error) {
      console.log("Tour status update skipped (Parse endpoint not available):", error.message);
      // Non-critical - tour status update can fail gracefully
    }
  };

  async function checkTourStatus() {
    try {
      const extUser = await userService.getCurrentUser();
      if (extUser) {
        localStorage.setItem("Extand_Class", JSON.stringify([extUser]));
        const tourStatus = extUser?.TourStatus || [];
        setTourStatusArr(tourStatus);
        const loginTour = tourStatus.find((obj) => obj.loginTour)?.loginTour;
        setIsTour(!loginTour);
      } else {
        setIsTour(true);
      }
    } catch (error) {
      console.error("Error checking tour status:", error);
      setIsTour(true);
    }
  }

  return isValidSession ? (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* HEADER */}
      <header className="z-[501]">
        {!isLoader && <Header setIsLoggingOut={setIsLoggingOut} />}
      </header>
      {isLoader ? (
        <div className="flex h-[100vh] justify-center items-center">
          <Loader />
        </div>
      ) : (
        <>
          {isLoggingOut && (
            <div className="inset-0 bg-black/30 z-[1000] fixed flex justify-center items-center">
              <Loader />
            </div>
          )}
          {/* BODY */}
          <div className="flex flex-1 overflow-hidden">
            {/* SIDEBAR with width animation */}
            <Sidebar />
            {/* MAIN (includes both content + footer in one scrollable column) */}
            <main
              id="renderList"
              className="flex-1 overflow-auto transition-all duration-300 ease-in-out"
            >
              <div className="flex flex-col min-h-full">
                {/* your page content */}
                <div className="p-3">{<Outlet />}</div>
                {/* sticky-but-scrollable footer */}
                <div className="mt-auto z-30">
                  <Footer />
                </div>
              </div>
            </main>
          </div>
          {isTour && (
            <Tour
              onRequestClose={closeTour}
              steps={tourConfigs}
              isOpen={isTour}
              // scrollOffset={-100}
              showCloseButton={isCloseBtn}
            />
          )}
        </>
      )}
    </div>
  ) : (
    <SessionExpiredModal />
  );
};

export default HomeLayout;
