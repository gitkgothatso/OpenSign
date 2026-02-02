import React, { useEffect, useState } from "react";
import LoaderWithMsg from "../../primitives/LoaderWithMsg";
import { contractDocument } from "../../constant/Utils";
import HandleError from "../../primitives/HandleError";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
function useQuery() {
  return new URLSearchParams(useLocation().search);
}
function DraftDocument() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = useQuery();
  const docId = query.get("docId");
  const [isLoading, setIsLoading] = useState({
    isLoader: true,
    message: t("loading-mssg")
  });
  useEffect(() => {
    if (docId) {
      getDocumentDetails();
    } else {
      setIsLoading({ isLoader: false, message: t("no-data") });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);
  //get document details
  const getDocumentDetails = async () => {
    try {
      if (!docId) {
        setIsLoading({ isLoader: false, message: t("no-data") });
        return;
      }
      
      //getting document details
      const documentData = await contractDocument(docId);
      console.log("DraftDocument: documentData received:", documentData);
      
      if (documentData && Array.isArray(documentData) && documentData.length > 0) {
        console.log("DraftDocument: Processing document:", documentData[0]);
        handleDraftDoc(documentData);
      } else if (
        documentData === "Error: Something went wrong!" ||
        (documentData && documentData.result && documentData.result.error)
      ) {
        if (documentData?.result?.error?.includes("deleted")) {
          setIsLoading({
            isLoader: false,
            message: t("document-deleted")
          });
        } else {
          setIsLoading({
            isLoader: false,
            message: t("something-went-wrong-mssg")
          });
        }
      } else if (documentData && documentData.error) {
        setIsLoading({
          isLoader: false,
          message: documentData.error || t("something-went-wrong-mssg")
        });
      } else {
        setIsLoading({ isLoader: false, message: t("no-data") });
      }
    } catch (error) {
      console.error("Error loading document:", error);
      setIsLoading({
        isLoader: false,
        message: error.message || t("something-went-wrong-mssg")
      });
    }
  };

  //check document type and render on signyour self and placeholder route
  const handleDraftDoc = (documentData) => {
    const data = documentData[0];
    if (!data || !data.objectId) {
      console.warn("DraftDocument: Invalid document data:", data);
      setIsLoading({ isLoader: false, message: t("no-data") });
      return;
    }
    
    const signerExist = data.Signers && Array.isArray(data.Signers) ? data.Signers : [];
    const isDecline = data.IsDeclined && data.IsDeclined;
    const isPlaceholder = data.Placeholders && Array.isArray(data.Placeholders) ? data.Placeholders : [];
    const signedUrl = data.SignedUrl;
    const isSignyourself = data?.IsSignyourself || data?.Type === 'self-sign';
    
    console.log("DraftDocument: Document state:", {
      isCompleted: data.IsCompleted,
      signerCount: signerExist.length,
      placeholderCount: isPlaceholder.length,
      hasSignedUrl: !!signedUrl,
      isSignyourself,
      type: data.Type
    });
    
    // Priority 1: Check if document is declined
    if (isDecline) {
      navigate(`/recipientSignPdf/${data.objectId}`);
      return;
    }
    
    // Priority 2: Check if it's a self-sign document (always go to signaturePdf for editing/viewing)
    // This should be checked BEFORE checking IsCompleted to handle completed self-sign documents
    if (isSignyourself || data?.Type === 'self-sign') {
      console.log("DraftDocument: Self-sign document detected, navigating to signaturePdf");
      navigate(`/signaturePdf/${data.objectId}`);
      return;
    }
    
    // Priority 3: Completed document with signers
    if (data?.IsCompleted && signerExist?.length > 0) {
      navigate(`/recipientSignPdf/${data.objectId}`);
      return;
    }
    
    // Priority 4: Completed document without signers (treat as sign-yourself)
    if (data?.IsCompleted && (!signerExist || signerExist.length === 0)) {
      navigate(`/signaturePdf/${data.objectId}`);
      return;
    }
    
    // Priority 5: Draft document with signers and placeholders but not signed yet
    if (signerExist?.length > 0 && isPlaceholder?.length > 0 && !signedUrl) {
      navigate(`/placeHolderSign/${data.objectId}`);
      return;
    }
    
    // Priority 6: In-progress document (has placeholders and signed URL)
    if (isPlaceholder?.length > 0 && signedUrl) {
      navigate(`/recipientSignPdf/${data.objectId}`);
      return;
    }
    
    // Priority 7: Placeholder draft document (has signers but no placeholders, or vice versa)
    if (
      (signerExist?.length > 0 && (!isPlaceholder || isPlaceholder?.length === 0)) ||
      ((!signerExist || signerExist?.length === 0) && isPlaceholder?.length > 0)
    ) {
      navigate(`/placeHolderSign/${data.objectId}`);
      return;
    }
    
    // Fallback: Default to placeholder sign for editing
    navigate(`/placeHolderSign/${data.objectId}`);
  };

  return (
    <div>
      {isLoading.isLoader ? (
        <LoaderWithMsg isLoading={isLoading} />
      ) : (
        <HandleError handleError={isLoading.message} />
      )}
    </div>
  );
}

export default DraftDocument;
