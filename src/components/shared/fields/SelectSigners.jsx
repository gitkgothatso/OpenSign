import React, { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import { useTranslation } from "react-i18next";
import { handleUnlinkSigner } from "../../../constant/Utils";
import contactService from "../../../services/contactService";

const SelectSigners = (props) => {
  const { t } = useTranslation();
  const {
    signerPos,
    setSignerPos,
    signersData,
    setSignersData,
    uniqueId,
    isRemove,
    handleAddUser
  } = props;
  const [userList, setUserList] = useState([]);
  const [selected, setSelected] = useState();
  const [userData, setUserData] = useState({});
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    //condition to check already assign signer exist if yes then show signer's email on dropdown input box
    if (userList.length > 0 && props.isExistSigner) {
      const alreadyAssign = userList.find(
        (item) => item.objectId === props.isExistSigner.signerObjId
      );
      if (alreadyAssign) {
        setSelected({
          label: `${alreadyAssign.Name}<${alreadyAssign.Email}>`,
          value: alreadyAssign.objectId
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userList]);
  // `handleOptions` is used to set just save from quick form to selected option in dropdown
  const handleOptions = (item) => {
    //checking if user select no signer option from dropdown
    if (item) {
      //checking selected signer is already assign to the document or not
      const alreadyAssign = signersData.some(
        (item2) => item2.objectId === item.value
      );
      if (alreadyAssign) {
        alert(t("already-exist-signer"));
        setSelected("");
      } else {
        setSelected(item);
        const userData = userList.find((x) => x.objectId === item.value);
        if (userData) {
          setUserData(userData);
        }
      }
    } else {
      setSelected(item);
    }
  };
  const handleAdd = () => {
    if (userData && userData.objectId) {
      handleAddUser(userData);
      if (props.closePopup) {
        props.closePopup();
      }
    } else if (selected?.value) {
      if (props.closePopup) {
        props.closePopup();
      }
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 1000);
    }
  };
  //function to use remove signer from assigned widgets in create template flow
  const handleRemove = () => {
    handleUnlinkSigner(
      signerPos,
      setSignerPos,
      signersData,
      setSignersData,
      uniqueId
    );
    if (props.closePopup) {
      props.closePopup();
    }
  };
  const loadOptions = async (inputValue) => {
    try {
      // Use new REST API endpoint for searching contacts
      const searchTerm = inputValue || "";
      const response = await contactService.searchContacts(searchTerm, null, 0, 50);
      
      // Extract contacts from paginated response
      const contacts = response?.content || [];
      
      // Transform to expected format (PascalCase for compatibility)
      const result = contacts.map(contact => ({
        objectId: contact.objectId || contact.id,
        id: contact.objectId || contact.id,
        Name: contact.Name || contact.name,
        Email: contact.Email || contact.email,
        Phone: contact.Phone || contact.phone || '',
        Company: contact.Company || contact.company || '',
        JobTitle: contact.JobTitle || contact.jobTitle || ''
      }));
      
      setUserList(result);
      return result.map((item) => ({
        label: `${item.Name}<${item.Email}>`,
        value: item.objectId
      }));
    } catch (error) {
      console.log("err in loadOptions", error);
      return [];
    }
  };
  return (
    <div className="h-full px-[20px] py-[10px] text-base-content">
      <div className="w-full mx-auto p-[8px]">
        <div className="mb-0">
          <label className="text-[14px] font-bold">
            {t("choose-from-contacts")}
          </label>
          <div className="flex gap-2 ">
            <div className="flex-1">
              <AsyncSelect
                cacheOptions
                defaultOptions
                value={selected}
                loadingMessage={() => t("loading")}
                noOptionsMessage={() => t("contact-not-found")}
                loadOptions={loadOptions}
                onChange={handleOptions}
                unstyled
                onFocus={() => loadOptions()}
                classNames={{
                  control: () =>
                    "op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full h-full text-[11px]",
                  valueContainer: () =>
                    "flex flex-row gap-x-[2px] gap-y-[2px] md:gap-y-0 w-full my-[2px]",
                  multiValue: () =>
                    "op-badge op-badge-primary h-full text-[11px]",
                  multiValueLabel: () => "mb-[2px]",
                  menu: () =>
                    "mt-1 shadow-md rounded-lg bg-base-200 text-base-content absolute z-9999",
                  menuList: () => "shadow-md rounded-lg  ",
                  option: () =>
                    "bg-base-200 text-base-content rounded-lg m-1 hover:bg-base-300 p-2 ",
                  noOptionsMessage: () => "p-2 bg-base-200 rounded-lg m-1 p-2"
                }}
                menuPortalTarget={document.getElementById("selectSignerModal")}
              />
            </div>
            {!props.isContact && (
              <button
                onClick={() => props.setIsContact(true)}
                className="op-btn op-btn-accent  op-btn-outline op-btn-sm  "
              >
                <i className="fa-light fa-plus"></i>
              </button>
            )}
          </div>
        </div>
        <p
          className={`${
            isError ? "text-[red]" : "text-transparent"
          } text-[11px] ml-[6px] my-[2px]`}
        >
          {t("select-signer")}
        </p>
        <div className="flex gap-2">
          <button className="op-btn op-btn-primary" onClick={() => handleAdd()}>
            {t("submit")}
          </button>
          {props.isExistSigner && isRemove && (
            <button
              className="op-btn op-btn-accent op-btn-outline"
              onClick={() => handleRemove()}
            >
              {t("no-signer")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectSigners;
