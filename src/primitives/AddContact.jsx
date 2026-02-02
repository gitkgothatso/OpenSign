import { useState, useEffect } from "react";
import Loader from "./Loader";
import { useTranslation } from "react-i18next";
import { emailRegex } from "../constant/const";
import { useDispatch } from "react-redux";
import { sessionStatus } from "../redux/reducers/userReducer";
import contactService from "../services/contactService";

const AddContact = (props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [addYourself, setAddYourself] = useState(false);
  const [isLoader, setIsLoader] = useState(false);
  const [isUserExist, setIsUserExist] = useState(false);
  const [isOptionalDetails, setIsOptionalDetails] = useState(false);

  useEffect(() => {
    checkUserExist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Load user details from localStorage when the component mounts
  useEffect(() => {
    const savedUserDetails = JSON.parse(
      localStorage.getItem("UserInformation")
    );
    if (savedUserDetails && addYourself) {
      setName(savedUserDetails.name);
      setPhone(savedUserDetails?.phone || "");
      setEmail(savedUserDetails.email);
      setJobTitle(savedUserDetails?.jobTitle || "");
      setCompany(savedUserDetails?.company || "");
    }
  }, [addYourself]);

  const checkUserExist = async () => {
    try {
      const contact = await contactService.checkUserInContactBook();
      // If contact doesn't exist (null), show the "add yourself" checkbox
      // This is expected behavior - most users won't have themselves in their contact book initially
      if (!contact || !contact.id) {
        setIsUserExist(true);
      }
    } catch (err) {
      // Silently handle errors - 404 is expected, other errors shouldn't break the UI
      // Always allow adding yourself as a fallback
      if (err?.isExpected404 !== true && err?.response?.status !== 404) {
        // Only log unexpected errors (not 404s)
        console.warn("Unexpected error checking user in contact book:", err?.response?.status || err?.message);
      }
      setIsUserExist(true);
    }
  };
  // Define a function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!emailRegex.test(email)) {
      alert(t("valid-email-alert"));
    } else {
      setIsLoader(true);
      try {
        // Create contact using REST API
        // Note: Backend will automatically associate tenant and user from authenticated JWT token
        // No need to fetch tenantId - backend handles it from authentication context
        const contactRes = await contactService.createContact({
          name,
          email,
          phone,
          company,
          jobTitle
        });

        // Map response to expected format (objectId -> id)
        const mappedContact = {
          ...contactRes,
          objectId: contactRes.id || contactRes.objectId
        };

        if (mappedContact.objectId || mappedContact.id) {
          props.details(mappedContact, props?.newContactId);
          if (props.closePopup) {
            props.closePopup();
            setIsLoader(false);
            // Reset the form fields
            handleReset();
          }
        } else {
          setIsLoader(false);
          alert(t("something-went-wrong-mssg"));
        }
      } catch (err) {
        console.log("Err creating contact", err);
        setIsLoader(false);
        
        // Check if it's a 401 (unauthorized) - only then should we logout
        if (err?.response?.status === 401) {
          dispatch(sessionStatus(false));
          alert(t("session-expired-mssg") || t("something-went-wrong-mssg"));
        } else {
          // For other errors, show appropriate message without logging out
          const errorMessage = err?.response?.data?.error || err?.response?.data?.message || "";
          if (errorMessage.includes("already exists") || errorMessage.includes("duplicate") || errorMessage.includes("email")) {
            alert(t("add-signer-alert") || t("contact-already-exists") || t("something-went-wrong-mssg"));
          } else {
            alert(t("something-went-wrong-mssg"));
          }
        }
      }
    }
  };

  // Define a function to handle the "add yourself" checkbox
  const handleAddYourselfChange = () => {
    if (addYourself) {
      handleReset();
    } else {
      setAddYourself(true);
    }
  };
  const handleReset = () => {
    setAddYourself(false);
    setName("");
    setPhone("");
    setEmail("");
    setJobTitle("");
    setCompany("");
  };

  return (
    <div className="h-full px-[20px] py-[10px]">
      {isLoader && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-30">
          <Loader />
        </div>
      )}
      <div className="w-full mx-auto p-[8px]">
        {!props?.isDisableTitle && (
          <div className="text-[14px] font-[700] text-base-content mb-1">
            {t("add-contact")}
          </div>
        )}
        {isUserExist && props?.isAddYourSelfCheckbox && (
          <div className="mb-[0.75rem] flex items-center mt-1">
            <input
              type="checkbox"
              id="addYourself"
              checked={addYourself}
              onChange={handleAddYourselfChange}
              className="op-checkbox op-checkbox-sm"
            />
            <label
              htmlFor="addYourself"
              className="ml-[0.5rem] text-base-content mb-0"
            >
              {t("add-yourself")}
            </label>
          </div>
        )}
        <form className="text-base-content" onSubmit={handleSubmit}>
          <div className="mb-[0.75rem]">
            <label htmlFor="name" className="text-[13px]">
              {t("name")}
              <span className="text-[13px] text-[red]"> *</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onInvalid={(e) => e.target.setCustomValidity(t("input-required"))}
              onInput={(e) => e.target.setCustomValidity("")}
              required
              disabled={addYourself}
              className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
              placeholder={t("enter-name")}
            />
          </div>
          <div className="mb-[0.75rem]">
            <label htmlFor="email" className="text-[13px]">
              {t("email")}
              <span className="text-[13px] text-[red]"> *</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value?.toLowerCase()?.replace(/\s/g, ""))
              }
              onInvalid={(e) => e.target.setCustomValidity(t("input-required"))}
              onInput={(e) => e.target.setCustomValidity("")}
              required
              disabled={addYourself}
              className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs lowercase"
              placeholder={t("enter-email")}
            />
          </div>
          {isOptionalDetails && (
            <>
              <div className="mb-[0.75rem]">
                <label htmlFor="phone" className="text-[13px]">
                  {t("phone")}
                </label>
                <input
                  type="text"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  // disabled={addYourself}
                  className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                  placeholder={t("phone-optional")}
                />
              </div>
              <div className="mb-[0.75rem]">
                <label htmlFor="company" className="text-[13px]">
                  {t("company")}
                </label>
                <input
                  type="text"
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  // disabled={addYourself}
                  className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                  placeholder={t("phone-optional")}
                />
              </div>
              <div className="mb-[0.75rem]">
                <label htmlFor="jobTitle" className="text-[13px]">
                  {t("job-title")}
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  // disabled={addYourself}
                  className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                  placeholder={t("phone-optional")}
                />
              </div>
            </>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsOptionalDetails(!isOptionalDetails);
            }}
            className="text-base-content/60 no-underline hover:underline focus:outline-none"
          >
            {isOptionalDetails
              ? t("hide-optional-details")
              : t("optional-details")}
          </button>

          <div className="mt-6 flex justify-start gap-2">
            <button type="submit" className="op-btn op-btn-primary">
              {t("submit")}
            </button>
            <button
              type="button"
              onClick={() => handleReset()}
              className="op-btn op-btn-secondary"
            >
              {t("reset")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContact;
