import React, { useState } from "react";
import { folderService } from "../../../services/folderService";
import { authService } from "../../../services/authService";
import Alert from "../../../primitives/Alert";
import Loader from "../../../primitives/Loader";
import { useTranslation } from "react-i18next";

const CreateFolder = ({ parentFolderId, onSuccess, folderCls, onBack }) => {
  const folderPtr = {
    __type: "Pointer",
    className: folderCls,
    objectId: parentFolderId
  };
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [isLoader, setIsLoader] = useState(false);
  const [alert, setAlert] = useState({ type: "info", message: "" });
  const showToast = (type, msg) => {
    setAlert({ type: type, message: msg });
    setTimeout(() => setAlert({ type: type, message: "" }), 1000);
  };
  const handleCreateFolder = async (event) => {
    event.preventDefault();
    handleLoader(true);
    if (name) {
      try {
        // Check if folder already exists
        const exists = await folderService.folderExists(name);
        if (exists) {
          showToast("danger", t("folder-already-exist"));
          handleLoader(false);
        } else {
          // Create folder (CreatedBy is automatically set by backend)
          const folderData = {
            name: name,
            type: "Folder"
          };
          if (parentFolderId) {
            folderData.folderId = parentFolderId;
          }
          const res = await folderService.createFolder(folderData);
          if (res) {
            handleLoader(false);
            showToast("success", t("folder-created-successfully"));
            onSuccess && onSuccess(res);
          }
        }
      } catch (error) {
        console.error("Error creating folder:", error);
        showToast("danger", t("error-creating-folder"));
        handleLoader(false);
      }
    } else {
      handleLoader(false);
      showToast("info", t("fill-folder-name"));
    }
  };
  const handleLoader = (status) => setIsLoader(status);

  return (
    <div>
      {alert.message && <Alert type={alert.type}>{alert.message}</Alert>}
      <div id="createFolder" className="relative">
        {isLoader && (
          <div className="absolute h-full w-full flex justify-center items-center">
            <Loader />
          </div>
        )}
        <h1 className="text-base font-semibold mt-[0.4rem]">
          {t("create-folder")}
        </h1>
        <div className="text-xs mt-2">
          <label className="block">
            {t("name")}
            <span className="text-red-500 text-[13px]">*</span>
          </label>
          <input
            className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onInvalid={(e) => e.target.setCustomValidity(t("input-required"))}
            onInput={(e) => e.target.setCustomValidity("")}
            required
          />
        </div>
        <div className="flex justify-between items-center py-[1rem] ">
          <button
            onClick={handleCreateFolder}
            disabled={isLoader}
            className="op-btn op-btn-primary op-btn-sm"
          >
            <i className="fa-light fa-plus"></i>
            <span>{t("create")}</span>
          </button>
          {onBack && (
            <div
              className="op-btn op-btn-seconday op-btn-sm"
              title={t("back")}
              onClick={() => onBack()}
            >
              <i className="fa-light fa-arrow-left" aria-hidden="true"></i>
              <span className="text-xs">{t("back")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateFolder;
