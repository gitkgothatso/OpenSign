import { storageService } from "../services/storageService";
export const SaveFileSize = async (size, imageUrl, tenantId, userId) => {
  // Skip if tenantId is not provided (optional tracking)
  if (!tenantId || (typeof tenantId === 'string' && tenantId.trim() === "")) {
    console.log("SaveFileSize: tenantId not provided, skipping storage tracking");
    return;
  }

  // Extract tenantId as string (handle both Parse pointer object and plain string)
  const tenantIdStr = typeof tenantId === 'string' 
    ? tenantId 
    : (tenantId?.objectId || tenantId?.id || tenantId);
  
  if (!tenantIdStr) {
    console.log("SaveFileSize: Could not extract tenantId, skipping storage tracking");
    return;
  }
  
  try {
    const response = await storageService.getTenantCredits(tenantIdStr);
    // Backend returns a single object with: { id, tenantId, usedStorage, totalStorage }
    if (response && (response.id || response.tenantId)) {
      const newUsedStorage = (response.usedStorage || 0) + size;
      await storageService.updateTenantCredits(
        tenantIdStr,
        newUsedStorage
      );
    } else {
      await storageService.createTenantCredits(
        tenantIdStr,
        size
      );
    }
  } catch (err) {
    // If 404, create new credits record (expected when credits don't exist yet)
    if (err?.response?.status === 404 || err?.isExpected404) {
      try {
        await storageService.createTenantCredits(tenantIdStr, size);
      } catch (createErr) {
        // Only log if it's not an expected 404
        if (createErr?.response?.status !== 404 && !createErr?.isExpected404) {
          console.warn("Error creating tenant credits:", createErr);
        }
      }
    } else {
      // Only log unexpected errors
      if (err?.response?.status !== 404 && !err?.isExpected404) {
        console.warn("Error saving storage usage:", err);
      }
    }
  }
  
  // Extract userId as string (handle both Parse pointer object and plain string)
  const userIdStr = userId 
    ? (typeof userId === 'string' ? userId : (userId?.objectId || userId?.id || userId))
    : null;
  
  saveDataFile(size, imageUrl, tenantIdStr, userIdStr);
};

//function for save fileUrl and file size in particular client db class partners_DataFiles
const saveDataFile = async (size, imageUrl, tenantId, userId) => {
  try {
    await storageService.saveDataFile(
      imageUrl,
      size,
      tenantId,
      userId
    );
  } catch (err) {
    // Only log unexpected errors (404s are expected if file record doesn't exist)
    if (err?.response?.status !== 404 && !err?.isExpected404) {
      console.warn("Error saving data file:", err);
    }
  }
};
