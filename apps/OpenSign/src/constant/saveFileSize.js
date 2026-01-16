import axios from "axios";
import { storageService } from "../services/storageService";
import { serverUrl_fn } from "./appinfo";
const parseAppId = process.env.REACT_APP_APPID
  ? process.env.REACT_APP_APPID
  : "opensign";
const serverUrl = serverUrl_fn();
const commonheader = {
  "Content-Type": "application/json",
  "X-Parse-Application-Id": parseAppId
};
export const SaveFileSize = async (size, imageUrl, tenantId, userId) => {
  // Skip if tenantId is not provided (optional tracking)
  if (!tenantId || tenantId.trim() === "") {
    console.log("SaveFileSize: tenantId not provided, skipping storage tracking");
    return;
  }

  //checking server url and save file's size
  const tenantPtr = {
    __type: "Pointer",
    className: "partners_Tenant",
    objectId: tenantId
  };
  const UserPtr = userId && {
    __type: "Pointer",
    className: "_User",
    objectId: userId
  };
  const _tenantPtr = JSON.stringify(tenantPtr);
  try {
    const response = await storageService.getTenantCredits(tenantPtr.__type === 'Pointer' ? tenantPtr.objectId : tenantPtr);
    let data;
    if (response && response.length > 0) {
      data = {
        usedStorage: response[0].usedStorage
          ? response[0].usedStorage + size
          : size
      };
      await storageService.updateTenantCredits(
        response.objectId || response[0].objectId,
        data.usedStorage
      );
    } else {
      data = { usedStorage: size, PartnersTenant: tenantPtr };
      await storageService.createTenantCredits(
        tenantPtr.__type === 'Pointer' ? tenantPtr.objectId : tenantPtr,
        data.usedStorage
      );
    }
  } catch (err) {
    console.log("err in save usage", err);
  }
  saveDataFile(size, imageUrl, tenantPtr, UserPtr);
};

//function for save fileUrl and file size in particular client db class partners_DataFiles
const saveDataFile = async (size, imageUrl, tenantPtr, UserId) => {
  const data = {
    FileUrl: imageUrl,
    FileSize: size,
    TenantPtr: tenantPtr,
    ...(UserId ? { UserId: UserId } : {})
  };
  try {
    await storageService.saveDataFile(
      data.FileUrl,
      data.FileSize,
      data.TenantPtr.__type === 'Pointer' ? data.TenantPtr.objectId : data.TenantPtr,
      data.UserId
    );
  } catch (err) {
    console.log("err in save usage ", err);
  }
};
