import { useEffect, useState } from "react";
import Loader from "../primitives/Loader";
import {
  copytoData,
  usertimezone
} from "../constant/Utils";
import {
  emailRegex,
} from "../constant/const";
import {
  useTranslation
} from "react-i18next";
import teamService from "../services/teamService";
import userService from "../services/userService";
import apiClient from "../config/api";

function generatePassword(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const AddUser = (props) => {
  const { t } = useTranslation();
  const [formdata, setFormdata] = useState({
    name: "",
    phone: "",
    email: "",
    team: "",
    password: "",
    role: ""
  });
  const [isFormLoader, setIsFormLoader] = useState(false);
  const [teamList, setTeamList] = useState([]);
  const role = ["OrgAdmin", "Editor", "User"];
  useEffect(() => {
    getTeamList();
    // eslint-disable-next-line
  }, []);

  const getTeamList = async () => {
    try {
      setFormdata((prev) => ({ ...prev, password: generatePassword(12) }));
      // Use new Java backend team service
      const teamRes = await teamService.getAll();
      if (teamRes.length > 0) {
        setTeamList(teamRes);
        const allUserId =
          teamRes.find((x) => x.name === "All Users")?.objectId || "";
        setFormdata((prev) => ({ ...prev, team: allUserId }));
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
      props.showAlert("danger", t("something-went-wrong-mssg"));
    }
  };

  const checkUserExist = async () => {
    try {
      // Use new Java backend user service to check by email
      // getUserByEmail returns null if user not found (404), so no need for try-catch
      const user = await userService.getUserByEmail(formdata.email);
      return !!user; // Return true if user exists
    } catch (err) {
      // Only log unexpected errors
      console.error("Error checking user existence:", err);
      return false; // Return false on any error to allow user creation
    }
  };

  // Define a function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("=== Form Submit Handler Called ===");
    console.log("Form data:", { ...formdata, password: "***" });
    console.log("TenantId:", localStorage.getItem("TenantId"));
    
    // Validate required fields
    if (!formdata.name || !formdata.email || !formdata.role) {
      const missingFields = [];
      if (!formdata.name) missingFields.push("name");
      if (!formdata.email) missingFields.push("email");
      if (!formdata.role) missingFields.push("role");
      console.error("Missing required fields:", missingFields);
      props.showAlert("danger", t("input-required") || `Please fill in: ${missingFields.join(", ")}`);
      return;
    }
    
    if (!emailRegex.test(formdata.email)) {
      props.showAlert("danger", t("valid-email-alert"));
      return;
    }
    
    if (!formdata.password || formdata.password.length < 8) {
      props.showAlert("danger", t("password-must-be-at-least-8-characters") || "Password must be at least 8 characters");
      return;
    }
    
    const localUser = JSON.parse(localStorage.getItem("Extand_Class"))?.[0];
    let tenantId = localStorage.getItem("TenantId");
    
    // If TenantId not in localStorage, try to get it from user profile
    if (!tenantId) {
      console.log("TenantId not in localStorage, fetching from user profile...");
      try {
        const currentUser = await userService.getCurrentUser();
        // Try multiple possible formats for tenantId
        tenantId = currentUser?.TenantId?.objectId || 
                   currentUser?.TenantId || 
                   currentUser?.tenantId?.objectId || 
                   currentUser?.tenantId ||
                   localUser?.TenantId?.objectId ||
                   localUser?.TenantId ||
                   localUser?.tenantId?.objectId ||
                   localUser?.tenantId ||
                   null;
        
        if (tenantId) {
          console.log("Found TenantId from user profile:", tenantId);
          localStorage.setItem("TenantId", tenantId);
        } else {
          console.warn("TenantId not found in user profile either. Proceeding without tenantId (backend allows optional tenantId).");
        }
      } catch (err) {
        console.error("Error fetching user profile for TenantId:", err);
        // Continue without tenantId - backend allows it to be optional
      }
    }
    
    setIsFormLoader(true);
    try {
      const userExists = await checkUserExist();
      if (userExists) {
        props.showAlert("danger", t("user-already-exist"));
        setIsFormLoader(false);
        return;
      }
      
      const timezone = usertimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const params = {
        name: formdata.name,
        email: formdata.email,
        phone: formdata.phone || "",
        password: formdata.password,
        role: formdata.role,
        timezone: timezone
      };
      
      // Only include tenantId if we have it (backend allows it to be optional)
      if (tenantId) {
        params.tenantId = tenantId;
      }
      
      // Only include organization if we have the data
      if (localUser?.OrganizationId?.objectId || localUser?.Company) {
        params.organization = {
          objectId: localUser?.OrganizationId?.objectId || null,
          company: localUser?.Company || null
        };
      }
      
      // Only include team if selected
      if (formdata.team) {
        params.team = formdata.team;
      }
      
      console.log("Creating user with params:", { ...params, password: "***" }); // Log without password
      
      // Use new Java backend API to create user
      const response = await apiClient.post('/users', params);
      const parseData = response.data;
      
      console.log("User created successfully:", parseData);
      
      if (props.closePopup) {
        props.closePopup();
      }
      if (props.handleUserData) {
        if (formdata?.team) {
          const team = teamList.find((x) => x.objectId === formdata.team);
          if (team) {
            parseData.TeamIds = parseData.TeamIds?.map((y) =>
              y.objectId === team.objectId ? team : y
            ) || [team];
          }
        }
        props.handleUserData(parseData);
      }
      setIsFormLoader(false);
      setFormdata({
        name: "",
        email: "",
        phone: "",
        team: "",
        role: "",
        password: generatePassword(12)
      });
      props.showAlert("success", t("user-created-successfully"));
    } catch (err) {
      console.error("Error creating user:", err);
      console.error("Error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setIsFormLoader(false);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || t("something-went-wrong-mssg");
      props.showAlert("danger", errorMsg);
    }
  };

  // Define a function to handle the "add yourself" checkbox
  const handleReset = () => {
    setFormdata({ 
      name: "", 
      email: "", 
      phone: "", 
      team: "", 
      role: "",
      password: generatePassword(12)
    });
    if (props.closePopup) {
      props.closePopup();
    }
  };

  const handleChange = (event) => {
    let { name, value } = event.target;
    if (name === "email") {
      value = value?.toLowerCase()?.replace(/\s/g, "");
    }
    setFormdata((prev) => ({ ...prev, [name]: value }));
  };

  const copytoclipboard = (text) => {
    copytoData(text);
    props.showAlert("success", t("copied"));
  };

  return (
    <div className="shadow-md rounded-box my-[1px] p-3 bg-base-100 relative">
      {isFormLoader && (
        <div className="absolute w-full h-full inset-0 flex justify-center items-center bg-base-content/30 z-50">
          <Loader />
        </div>
      )}
              <div className="w-full mx-auto">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label
                          htmlFor="name"
                          className="block text-xs font-semibold"
                        >
                          {t("name")}
                          <span className="text-[red] text-[13px]"> *</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formdata.name}
                          onChange={(e) => handleChange(e)}
                          onInvalid={(e) =>
                            e.target.setCustomValidity(t("input-required"))
                          }
                          onInput={(e) => e.target.setCustomValidity("")}
                          required
                          className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                          placeholder={t("enter-name")}
                        />
                      </div>
                      <div className="mb-3">
                        <label
                          htmlFor="email"
                          className="block text-xs font-semibold"
                        >
                          {t("email")}
                          <span className="text-[red] text-[13px]"> *</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formdata.email}
                          onChange={(e) => handleChange(e)}
                          required
                          onInvalid={(e) =>
                            e.target.setCustomValidity(t("input-required"))
                          }
                          onInput={(e) => e.target.setCustomValidity("")}
                          className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                          placeholder={t("enter-email")}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-semibold">
                          {t("password")}
                        </label>
                        <div className="flex justify-between items-center op-input op-input-bordered op-input-sm text-base-content w-full 
h-full text-[13px]">                                                                                                                                                <div className="break-all">{formdata?.password}</div>
                          <i
                            onClick={() => copytoclipboard(formdata?.password)}
                            className="fa-light fa-copy rounded-full hover:bg-base-300 p-[8px] cursor-pointer "
                          ></i>
                        </div>
                        <div className="text-[12px] ml-2 mb-0 text-[red] select-none">
                          {t("password-generateed")}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label
                          htmlFor="phone"
                          className="block text-xs font-semibold"
                        >
                          {t("phone")}
                        </label>
                        <input
                          type="text"
                          name="phone"
                          placeholder={t("phone-optional")}
                          value={formdata.phone}
                          onChange={(e) => handleChange(e)}
                          className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                        />
                      </div>
                      <div className="mb-3">
                        <label
                          htmlFor="phone"
                          className="block text-xs font-semibold"
                        >
                          {t("Role")}
                          <span className="text-[red] text-[13px]"> *</span>
                        </label>
                        <select
                          value={formdata.role}
                          onChange={(e) => handleChange(e)}
                          name="role"
                          className="op-select op-select-bordered op-select-sm focus:outline-none hover:border-base-content w-full text-xs
"                                                                                                                                                                   onInvalid={(e) =>
                            e.target.setCustomValidity(t("input-required"))
                          }
                          onInput={(e) => e.target.setCustomValidity("")}
                          required
                        >
                          <option defaultValue={""} value={""}>
                            {t("Select")}
                          </option>
                          {role.length > 0 &&
                            role.map((x) => (
                              <option key={x} value={x}>
                                {x}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex items-center mt-3 gap-2 text-white">
                        <button 
                          type="submit" 
                          className="op-btn op-btn-primary"
                          disabled={isFormLoader}
                        >
                          {isFormLoader ? t("submitting") || "Submitting..." : t("submit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReset()}
                          className="op-btn op-btn-secondary"
                          disabled={isFormLoader}
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </form>
              </div>
    </div>
  );
};

export default AddUser;
