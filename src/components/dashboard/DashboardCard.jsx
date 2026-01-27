import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Tooltip from "../../primitives/Tooltip";
import { useTranslation } from "react-i18next";
import { reportService } from "../../services/reportService";
import { authService } from "../../services/authService";
import { userService } from "../../services/userService";
import documentService from "../../services/documentService";
import { useUser } from "../../context/UserContext";
import apiClient from "../../config/api";

const DashboardCard = (props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useUser();
  const [response, setresponse] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Convert Parse query string to REST API filters
   * Handles hash replacements and converts to filter object
   */
  const parseQueryToFilters = (queryStr, userData) => {
    const filters = {};
    const currentUser = authService.getCurrentUser();
    
    // Replace hash placeholders with actual values
    let processedQuery = queryStr;
    processedQuery = processedQuery.split("#$").join("$");
    processedQuery = processedQuery.split("#*").join("$");
    processedQuery = processedQuery.split("_DOT_").join(".");
    
    // Extract filter conditions from query string
    // Example: "CreatedBy.objectId=#objectId#" -> { createdBy: currentUser.id }
    const hashRegex = /#([^#]+)#/g;
    const matches = processedQuery.match(hashRegex);
    
    if (matches) {
      matches.forEach(match => {
        const key = match.replace(/#/g, '');
        if (key === 'objectId' || key === 'id') {
          processedQuery = processedQuery.replace(match, currentUser?.id || userData?.objectId || '');
        } else if (userData && userData[key]) {
          processedQuery = processedQuery.replace(match, userData[key]);
        } else if (key.includes('.')) {
          const [parent, child] = key.split('.');
          if (userData && userData[parent] && userData[parent][child]) {
            processedQuery = processedQuery.replace(match, userData[parent][child]);
          }
        }
      });
    }
    
    // Parse query string into filter object
    // This is a simplified parser - may need enhancement based on actual query formats
    const params = new URLSearchParams(processedQuery);
    params.forEach((value, key) => {
      // Convert Parse field names to REST API filter names
      if (key === 'CreatedBy.objectId' || key === '_created_by') {
        filters.createdBy = value;
      } else if (key === 'IsCompleted') {
        filters.isCompleted = value === 'true';
      } else if (key === 'IsDeclined') {
        filters.isDeclined = value === 'true';
      } else if (key === 'IsArchive') {
        filters.isArchived = value === 'true';
      } else {
        filters[key] = value;
      }
    });
    
    return filters;
  };

  const renderData = async () => {
    if (props.Data.queryType === "function") {
      setLoading(true);
      try {
        // Use reportService for Parse Cloud Functions
        const currentUser = authService.getCurrentUser();
        let userData = user;
        
        if (localStorage.getItem("Extand_Class")) {
          try {
            const data = JSON.parse(localStorage.getItem("Extand_Class"));
            userData = data[0];
          } catch (e) {
            console.warn("Failed to parse Extand_Class:", e);
          }
        }
        
        if (!userData) {
          userData = await userService.getCurrentUser();
        }
        
        // Extract reportId from query if it's a report function
        // For now, use reportService with default parameters
        const reportId = props.Data.class?.replace('/functions/', '') || props.Data.Redirect_id;
        
        try {
          const reportData = await reportService.getReport(
            reportId,
            0,
            200,
            ""
          );
          
          if (reportData && reportData.length > 0) {
            // Extract the value based on props.Data.key
            const value = reportData[0]?.[props.Data.key] || reportData.length;
            setresponse(value);
          } else {
            setresponse(0);
          }
        } catch (error) {
          console.error("Report service error:", error);
          setresponse(0);
        }
        
        setLoading(false);
      } catch (e) {
        console.error("Problem", e.message);
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const currentUser = authService.getCurrentUser();
        
        // Get user data for hash replacements
        let userData = user;
        if (localStorage.getItem("Extand_Class")) {
          try {
            const data = JSON.parse(localStorage.getItem("Extand_Class"));
            userData = data[0];
          } catch (e) {
            console.warn("Failed to parse Extand_Class:", e);
          }
        }
        
        if (!userData) {
          userData = await userService.getCurrentUser();
        }

        // Handle specific report IDs
        if (props.Data.Redirect_id === "4Hhwbp482K") {
          // "Need your sign" - documents pending user's signature
          const params = {
            reportId: props.Data.Redirect_id,
            skip: 0,
            limit: 200
          };
          const listData = await reportService.getReport(
            params.reportId,
            params.skip,
            params.limit,
            ""
          );
          
          const filteredData = listData?.filter(
            (x) => x.Signers && x.Signers.length > 0
          );
          let arr = [];
          for (const obj of filteredData) {
            const isSigner = obj.Signers?.some(
              (item) => item.UserId?.objectId === currentUser.id || item.UserId === currentUser.id
            );
            if (isSigner) {
              let isRecord = false;
              if (obj?.AuditTrail && obj?.AuditTrail.length > 0) {
                isRecord = obj.AuditTrail.some(
                  (item) =>
                    (item?.UserPtr?.UserId?.objectId === currentUser.id ||
                     item?.UserPtr?.UserId === currentUser.id) &&
                    item.Activity === "Signed"
                );
              }
              if (!isRecord) {
                arr.push(obj);
              }
            }
          }
          setresponse(arr.length);
        } else if (props.Data.Redirect_id === "1MwEuxLEkF") {
          // "Out for signatures" - documents sent by user
          const filters = {
            isCompleted: false,
            isDeclined: false,
            isArchived: false,
            hasSigners: true
          };
          const count = await documentService.getDocumentCount(filters);
          setresponse(count);
        } else {
          // For other dashboard cards, try to use documentService or reportService
          // Convert Parse query to REST API filters
          const queryStr = props.Data.query || "";
          const filters = parseQueryToFilters(queryStr, userData);
          
          // Determine what to fetch based on props.Data.class
          if (props.Data.class === "contracts_Document") {
            // Use documentService for document queries
            if (props.Data.key === "count" || queryStr.includes("count")) {
              const count = await documentService.getDocumentCount(filters);
              setresponse(count);
            } else {
              const response = await documentService.getUserDocuments(0, 1, filters);
              const count = response.totalElements || response.length || 0;
              setresponse(count);
            }
          } else {
            // For other classes, try to use reportService or return 0
            console.warn(`Unknown class for dashboard card: ${props.Data.class}`);
            setresponse(0);
          }
        }
      } catch (e) {
        console.error("Problem fetching dashboard data:", e);
        setresponse(0);
      } finally {
        setLoading(false);
      }
    }
  };

  const filterRender = async () => {
    if (props.FilterData && props.FilterData.queryType === "function") {
      setLoading(true);
      try {
        // Get user data for hash replacements
        let userData = user;
        if (localStorage.getItem("Extand_Class")) {
          try {
            const data = JSON.parse(localStorage.getItem("Extand_Class"));
            userData = data[0];
          } catch (e) {
            console.warn("Failed to parse Extand_Class:", e);
          }
        }
        
        if (!userData) {
          userData = await userService.getCurrentUser();
        }

        // Process filter query with hash replacements
        let queryStr = typeof props.FilterData.query === 'string' 
          ? props.FilterData.query 
          : JSON.stringify(props.FilterData.query);
        
        // Replace filter condition placeholder
        if (props.Filter) {
          queryStr = queryStr.replace(/#filterCondition#/g, props.Filter);
        }
        
        // Replace user data placeholders
        const hashRegex = /#([^#]+)#/g;
        queryStr = queryStr.replace(hashRegex, (match, key) => {
          if (key === 'objectId' || key === 'id') {
            return authService.getCurrentUser()?.id || userData?.objectId || '';
          } else if (key.includes('.')) {
            const [parent, child] = key.split('.');
            return userData?.[parent]?.[child] || '';
          } else {
            return userData?.[key] || '';
          }
        });

        // Use reportService for filter queries
        const reportId = props.FilterData.class?.replace('/functions/', '') || props.FilterData.Redirect_id;
        
        try {
          const reportData = await reportService.getReport(
            reportId,
            0,
            200,
            props.Filter || ""
          );
          
          if (reportData && reportData.length > 0) {
            const value = reportData[0]?.[props.FilterData.key] || reportData.length;
            setresponse(value);
          } else {
            setresponse("0");
          }
        } catch (error) {
          console.error("Filter report service error:", error);
          setresponse("0");
        }
        
        setLoading(false);
      } catch (e) {
        console.error("Problem with filter render:", e);
        setLoading(false);
      }
    }
  };

  const setFormat = (val) => {
    switch (props.Format) {
      case "INR":
        if (val)
          return Number(val)
            .toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return 0;
      default:
        return val;
    }
  };

  useEffect(() => {
    renderData();
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (props.Filter) {
      filterRender();
    }
    //eslint-disable-next-line
  }, [props.Filter]);

  function openReport() {
    if (props.Data && props.Data.Redirect_type) {
      const Redirect_type = props.Data.Redirect_type;
      const id = props.Data.Redirect_id;
      if (Redirect_type === "Form") {
        navigate(`/form/${id}`);
      } else if (Redirect_type === "Report") {
        navigate(`/report/${id}`);
      } else if (Redirect_type === "Url") {
        window.location = id;
      } else if (Redirect_type === "Microapp") {
        navigate(`/microapp/${id}`);
      }
    }
  }

  return (
    <div
      onClick={() => openReport()}
      className={`${
        props.Data && props.Data.Redirect_type
          ? "cursor-pointer"
          : "cursor-default"
      }`}
    >
      <div className="flex items-center justify-start gap-5 text-white">
        <span className="rounded-full bg-base-300 bg-opacity-20 w-[60px] h-[60px] self-start flex justify-center items-center">
          <i
            className={`${
              props.Icon ? props.Icon : "fa-light fa-info"
            } text-[25px] lg:text-[30px]`}
          ></i>
        </span>

        <div className="font-medium">
          <div className="text-base lg:text-lg">
            {t(`dashboard-card.${props.Label}`)}
          </div>
          <div className="text-2xl font-light">
            {loading ? <div className="loader-01"></div> : setFormat(response)}
          </div>
        </div>
      </div>
      <div className="text-xs absolute top-3 right-2">
        <Tooltip
          id={props.Label}
          iconColor={"white"}
          message={t(`tour-mssg.${props.Label}`)}
        />
      </div>
    </div>
  );
};

export default DashboardCard;
