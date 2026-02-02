import React, { useState, useEffect, useRef } from "react";
import {
  handleToPrint,
  findContact,
} from "../../constant/Utils";
import {
  emailRegex,
} from "../../constant/const";
import Loader from "../../primitives/Loader";
import ModalUi from "../../primitives/ModalUi";
import { useTranslation } from "react-i18next";
import { documentService } from "../../services/documentService";

function EmailComponent({
  isEmail,
  setIsEmail,
  setSuccessEmail,
  pdfDetails,
  setIsAlert,
  setIsDownloadModal
}) {
  const { t } = useTranslation();
  const [emailList, setEmailList] = useState([]);
  const [emailValue, setEmailValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailErr, setEmailErr] = useState(false);
  const [isDownloading, setIsDownloading] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);
  const inputRef = useRef(null);
  const isAndroid = /Android/i.test(navigator.userAgent);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //function for send email
  const sendEmail = async () => {
    setIsLoading(true);
    try {
      const docId = pdfDetails?.[0]?.objectId || pdfDetails?.[0]?.id;
      // Backend expects "emails" (array of email strings) and optional "message"
      // emailList is an array of email strings
      const emailData = { 
        emails: emailList,
        message: "" // Optional message field
      };
      const sendmail = await documentService.forwardDocument(docId, emailData);
      // Backend returns { success: true, message: "...", recipients: number }
      if (sendmail?.success === true || sendmail?.status === "success") {
        setSuccessEmail(true);
        setIsEmail(false);
        setTimeout(() => {
          setSuccessEmail(false);
          setEmailValue("");
          setEmailList([]);
        }, 1500);
      } else {
        setIsEmail(false);
        setIsAlert({
          isShow: true,
          alertMessage: t("something-went-wrong-mssg")
        });
        setEmailValue("");
        setEmailList([]);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setIsEmail(false);
      setIsAlert({
        isShow: true,
        alertMessage: t("something-went-wrong-mssg")
      });
      setEmailValue("");
      setEmailList([]);
    } finally {
      setIsLoading(false);
    }
  };

  //function for remove email
  const removeChip = (index) => {
    const updateEmailCount = emailList.filter((data, key) => key !== index);
    setEmailList(updateEmailCount);
  };
  //function for get email value with contact suggestions
  const handleEmailValue = async (e) => {
    const value = e.target.value;
    const normalizedValue = value?.toLowerCase()?.replace(/\s/g, "");
    setEmailErr(false);
    setEmailValue(value); // Keep original value for display
    
    // Show suggestions if user is typing (at least 2 characters)
    if (normalizedValue && normalizedValue.length >= 2) {
      try {
        const contactRes = await findContact(normalizedValue);
        if (contactRes && contactRes.length > 0) {
          setSuggestions(contactRes);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.warn("Error fetching contact suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle selecting a contact from suggestions
  const handleSelectContact = (contact) => {
    const email = contact.Email || contact.email;
    if (email && !emailList.includes(email.toLowerCase())) {
      setEmailList((prev) => [...prev, email.toLowerCase()]);
      setEmailValue("");
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  //function for save email in array after press enter
  const handleEnterPress = (e) => {
    const pattern = emailRegex;
    const validate = emailValue?.match(pattern);
    if (e.key === "Enter" && emailValue) {
      if (validate) {
        const emailLowerCase = emailValue?.toLowerCase();
        setEmailList((prev) => [...prev, emailLowerCase]);
        setEmailValue("");
      } else {
        setEmailErr(true);
      }
    } else if (e === "add" && emailValue) {
      if (validate) {
        const emailLowerCase = emailValue?.toLowerCase();
        setEmailList((prev) => [...prev, emailLowerCase]);
        setEmailValue("");
      } else {
        setEmailErr(true);
      }
    }
  };
  const handleClose = () => {
    setIsEmail(false);
    setEmailValue("");
    setEmailList([]);
  };
  return (
    <div>
      {/* isEmail */}
      {isEmail && (
        <ModalUi isOpen showHeader={false}>
          {isLoading && (
            <div className="absolute w-full h-full flex flex-col justify-center items-center z-[20] bg-[#e6f2f2]/70">
              <Loader />
              <span className="text-[12px] text-base-content">
                {t("loader")}
              </span>
            </div>
          )}
          {isDownloading === "pdf" && (
            <div className="fixed z-[200] inset-0 flex justify-center items-center bg-black bg-opacity-30">
              <Loader />
            </div>
          )}
          <div className="flex justify-between items-center py-[10px] px-[20px] border-b-[1px] border-base-content">
            <span className="text-base-content font-bold text-sm md:text-lg">
              {t("successfully-signed")}
            </span>
            <div className="flex flex-row">
              {!isAndroid && (
                <button
                  onClick={(e) =>
                    handleToPrint(e, setIsDownloading, pdfDetails)
                  }
                  className="op-btn op-btn-neutral op-btn-sm text-xs md:text-[15px]"
                >
                  <i className="fa-light fa-print" aria-hidden="true"></i>
                  {t("print")}
                </button>
              )}
              <button
                className="op-btn op-btn-primary op-btn-sm text-xs md:text-[15px] ml-2"
                onClick={() => {
                  handleClose();
                  setIsDownloadModal(true);
                }}
              >
                <i className="fa-light fa-download" aria-hidden="true"></i>
                {t("download")}
              </button>
            </div>
          </div>
          <div className="h-full p-[20px]">
            <p className="font-medium text-[15px] mb-[5px] text-base-content align-baseline">
              {t("email-mssg")}
            </p>
            <div className="relative">
              {emailList.length > 0 ? (
                <div className="p-0 border-[1px] op-border-primary w-full rounded-md text-[15px] overflow-hidden">
                  <div className="flex flex-row flex-wrap">
                    {emailList.map((data, ind) => {
                      return (
                        <div
                          className="flex flex-row items-center op-bg-primary mx-[2px] mt-[2px] rounded-md py-[5px] px-[10px]"
                          key={ind}
                        >
                          <span className="text-base-100 text-[13px]">
                            {data}
                          </span>
                          <span
                            className="text-base-100 text-[13px] font-semibold ml-[7px] cursor-pointer"
                            onClick={() => removeChip(ind)}
                          >
                            <i className="fa-light fa-xmark"></i>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {emailList.length <= 9 && (
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="email"
                        value={emailValue}
                        className="p-[10px] rounded-md w-full text-[15px] bg-transparent outline-none"
                        onChange={handleEmailValue}
                        onKeyDown={handleEnterPress}
                        onFocus={() => emailValue && emailValue.length >= 2 && setShowSuggestions(true)}
                        onBlur={() => {
                          // Delay to allow suggestion click
                          setTimeout(() => {
                            if (emailValue && emailValue.match(emailRegex)) {
                              handleEnterPress("add");
                            }
                          }, 200);
                        }}
                        onInvalid={(e) =>
                          e.target.setCustomValidity(t("input-required"))
                        }
                        onInput={(e) => e.target.setCustomValidity("")}
                        placeholder={t("enter-email-plaholder") || "Enter email or select from contacts..."}
                        required
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <ul
                          ref={suggestionRef}
                          className="absolute z-50 left-0 top-full w-full max-h-[200px] overflow-y-auto bg-base-200 border border-base-300 rounded-md shadow-lg mt-1"
                        >
                          {suggestions.map((contact, index) => {
                            const email = contact.Email || contact.email;
                            const name = contact.Name || contact.name || email;
                            const isAlreadyAdded = emailList.includes(email?.toLowerCase());
                            return (
                              <li
                                key={index}
                                className={`py-2 px-3 w-full text-sm cursor-pointer hover:bg-base-300 ${
                                  isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                onClick={() => !isAlreadyAdded && handleSelectContact(contact)}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{name} &lt;{email}&gt;</span>
                                  {isAlreadyAdded && (
                                    <span className="text-xs text-base-content/60">
                                      {t("already-added") || "Added"}
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="email"
                    value={emailValue}
                    className="p-[10px] pb-[20px] text-base-content rounded-md w-full text-[15px] outline-none bg-transparent border-[1px] op-border-primary"
                    onChange={handleEmailValue}
                    onKeyDown={handleEnterPress}
                    onFocus={() => emailValue && emailValue.length >= 2 && setShowSuggestions(true)}
                    placeholder={t("enter-email-plaholder") || "Enter email or select from contacts..."}
                    onBlur={() => {
                      // Delay to allow suggestion click
                      setTimeout(() => {
                        if (emailValue && emailValue.match(emailRegex)) {
                          handleEnterPress("add");
                        }
                      }, 200);
                    }}
                    onInvalid={(e) =>
                      e.target.setCustomValidity(t("input-required"))
                    }
                    onInput={(e) => e.target.setCustomValidity("")}
                    required
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul
                      ref={suggestionRef}
                      className="absolute z-50 left-0 top-full w-full max-h-[200px] overflow-y-auto bg-base-200 border border-base-300 rounded-md shadow-lg mt-1"
                    >
                      {suggestions.map((contact, index) => {
                        const email = contact.Email || contact.email;
                        const name = contact.Name || contact.name || email;
                        return (
                          <li
                            key={index}
                            className="py-2 px-3 w-full text-sm cursor-pointer hover:bg-base-300"
                            onClick={() => handleSelectContact(contact)}
                          >
                            {name} &lt;{email}&gt;
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
            {emailErr && (
              <p className="text-xs text-[red] ml-1.5 mt-0.5">
                {t("email-error-1")}
              </p>
            )}
            <div className="mt-2">
              <button
                type="button"
                className="op-btn op-btn-secondary"
                onClick={() => emailList.length > 0 && sendEmail()}
              >
                {t("send")}
              </button>
              <button
                type="button"
                className="op-btn op-btn-ghost text-base-content ml-2"
                onClick={() => handleClose()}
              >
                {t("close")}
              </button>
            </div>
          </div>
        </ModalUi>
      )}
    </div>
  );
}

export default EmailComponent;
