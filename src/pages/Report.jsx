import { useEffect, useState, useRef } from "react";
import { authService } from "../services/authService";
import axios from "axios";
import { reportService } from "../services/reportService";
import reportJson, { extraCols } from "../json/ReportJson";
import { useParams } from "react-router";
import PageNotFound from "./PageNotFound";
import Loader from "../primitives/Loader";
import Contactbook from "../reports/contact/Contactbook";
import ColumnSelector from "../components/ColumnSelector";
import TemplatesReport from "../reports/template/TemplatesReport";
import DocumentsReport from "../reports/document/DocumentsReport";
import { templateReportTour } from "../json/ReportTour";

const Report = () => {
  const { id } = useParams();
  const abortController = new AbortController();
  const [list, setList] = useState([]);
  const [isLoader, setIsLoader] = useState(true);
  const [reportName, setReportName] = useState("");
  const [reporthelp, setReportHelp] = useState("");
  const [actions, setActions] = useState([]);
  const [heading, setHeading] = useState([]);
  const [isNextRecord, setIsNextRecord] = useState(false);
  const [isMoreDocs, setIsMoreDocs] = useState(true);
  const [tourData, setTourData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [allColumns, setAllColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [columnLabels, setColumnLabels] = useState({});
  const [defaultColumns, setDefaultColumns] = useState([]);
  const [isColumnModal, setIsColumnModal] = useState(false);
  const debounceTimer = useRef(null);
  // Number of documents to display per page (should always be half of docLimit for proper pagination)
  const docPerPage = 10;
  // Number of documents to fetch per API call
  const docLimit = 20;


  // below useEffect is call when id param change
  useEffect(() => {
    setReportName("");
    setList([]);
    setSearchTerm("");
    setMobileSearchOpen(false);
    const saved = JSON.parse(localStorage.getItem("reportColumns") || "{}");
    if (saved[id]) {
      setVisibleColumns(saved[id].visible || saved[id]);
      setColumnLabels(saved[id].labels || {});
    } else {
      setVisibleColumns([]);
      setColumnLabels({});
    }
    getReportData(0, docLimit, "");

    // Function returned from useEffect is called on unmount
    return () => {
      setIsLoader(true);
      setList([]);
      setIsNextRecord(false);
      // Here it'll abort the fetch
      abortController.abort();
    };
    // eslint-disable-next-line
  }, [id]);

  // below useEffect call when isNextRecord state is true and fetch next record
  useEffect(() => {
    if (isNextRecord) {
      getReportData(list?.length, docLimit, searchTerm);
    }
    // eslint-disable-next-line
  }, [isNextRecord]);

  const handleSearchChange = async (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          "X-Parse-Application-Id": localStorage.getItem("parseAppId"),
          sessiontoken: localStorage.getItem("accesstoken")
        };
        // Use reportService instead of Parse endpoint
        const data = await reportService.getReport(
          id,
          0,
          docPerPage,
          term
        );
        if (!data.error) {
          setList(data);
          setIsMoreDocs(data.length >= docPerPage);
          setIsNextRecord(false);
          setIsSearchResult(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 300);
    setIsSearchResult(false);
  };

  const handleSearchPaste = (e) => {
    setTimeout(() => {
      handleSearchChange({ target: { value: e.target.value } });
    }, 0);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
  const getReportData = async (
    skipUserRecord = 0,
    limit = 20,
    term = searchTerm
  ) => {
    // setIsLoader(true);
    const json = reportJson(id);
    if (json) {
      setActions(json.actions);
      const savedCols = JSON.parse(
        localStorage.getItem("reportColumns") || "{}"
      );
      const visible = savedCols[id]?.visible || json.heading;
      const labels = savedCols[id]?.labels || {};
      if (!savedCols[id] || id === "contacts") {
        savedCols[id] = { visible: json.heading, labels: {} };
        localStorage.setItem("reportColumns", JSON.stringify(savedCols));
      }
      setVisibleColumns(visible);
      setColumnLabels(labels);
      setHeading(visible);
      setDefaultColumns(json.heading);
      setReportName(json.reportName);
      setReportHelp(json?.helpMsg);
      const currentUser = authService.getCurrentUser()?.id;

      const headers = {
        "Content-Type": "application/json",
        "X-Parse-Application-Id": localStorage.getItem("parseAppId"),
        sessiontoken: localStorage.getItem("accesstoken")
      };
      // Calculate skip and limit values (needed for error logging)
      const skipRecord = id === "4Hhwbp482K" ? 0 : skipUserRecord;
      const limitRecord = id === "4Hhwbp482K" ? 200 : limit;
      
      try {
        // Use reportService instead of Parse endpoint
        // Pass searchTerm only if it's defined and not empty
        const res = await reportService.getReport(
          id,
          skipRecord,
          limitRecord,
          term && term.trim() !== '' ? term.trim() : undefined
        );
        const extraHeads =
          id === "4Hhwbp482K" ? [...extraCols, "Expiry Date"] : extraCols;
        setAllColumns(Array.from(new Set([...json.heading, ...extraHeads])));
        if (id === "6TeaPr321t") {
          setTourData(templateReportTour);
        }
        if (id === "4Hhwbp482K") {
          const listData = res.filter((x) => x.Signers.length > 0);
          let arr = [];
          for (const obj of listData) {
            const isSigner = obj?.Signers?.some(
              (item) => item.UserId.objectId === currentUser
            );
            if (isSigner) {
              let isRecord;
              if (obj?.AuditTrail && obj?.AuditTrail.length > 0) {
                isRecord = obj?.AuditTrail.some(
                  (item) =>
                    item?.UserPtr?.UserId?.objectId === currentUser &&
                    item.Activity === "Signed"
                );
              } else {
                isRecord = false;
              }
              if (isRecord === false) {
                arr.push(obj);
              }
            }
          }
          if (arr.length === docPerPage) {
            setIsMoreDocs(true);
          } else {
            setIsMoreDocs(false);
          }
          setList((prevRecord) =>
            prevRecord.length > 0 ? [...prevRecord, ...arr] : arr
          );
        } else {
          // For contacts and other reports, handle the response directly
          if (Array.isArray(res)) {
            if (res.length >= docPerPage) {
              setIsMoreDocs(true);
            } else {
              setIsMoreDocs(false);
            }
            if (!res.error) {
              setIsNextRecord(false);
              // For contacts, always replace the list (don't append)
              if (id === "contacts") {
                setList(res);
              } else {
                setList((prevRecord) =>
                  prevRecord.length > 0
                    ? [...prevRecord, ...res]
                    : res
                );
              }
            }
          } else {
            // If res is not an array, log error and set empty list
            console.error("Report response is not an array:", res);
            setList([]);
            setIsMoreDocs(false);
          }
        }
        setIsLoader(false);
      } catch (err) {
        const isCancel = axios.isCancel(err);
        if (!isCancel) {
          console.error("Report error:", err);
          // Log detailed error information
          if (err.response) {
            console.error("Report API Error Details:", {
              status: err.response.status,
              statusText: err.response.statusText,
              data: err.response.data,
              requestParams: { reportId: id, skip: skipRecord, limit: limitRecord, searchTerm: term }
            });
          }
          setIsLoader(false);
        }
      }
    } else {
      setIsLoader(false);
    }
  };

  const commonProps = {
    ReportName: reportName,
    List: list,
    setList,
    actions: actions,
    heading: heading,
    setIsNextRecord,
    isMoreDocs,
    docPerPage,
    mobileSearchOpen,
    setMobileSearchOpen,
    searchTerm,
    handleSearchChange,
    handleSearchPaste,
    isSearchResult,
    columnLabels,
    openColumnModal: () => setIsColumnModal(true)
  };
  return (
    <>
      {isLoader ? (
        <div className="h-[100vh] flex justify-center items-center">
          <Loader />
        </div>
      ) : (
        <>
          {id === "contacts" ? (
            <Contactbook {...commonProps} />
          ) : id === "6TeaPr321t" ? (
            <TemplatesReport
              {...commonProps}
              report_help={reporthelp}
              tourData={tourData}
            />
          ) : reportName ? (
            <DocumentsReport {...commonProps} report_help={reporthelp} />
          ) : (
            <PageNotFound prefix={"Report"} />
          )}
        </>
      )}
      <ColumnSelector
        isOpen={isColumnModal}
        allColumns={allColumns}
        visibleColumns={visibleColumns}
        columnLabels={columnLabels}
        defaultColumns={defaultColumns}
        onApply={(cols, labels) => {
          setVisibleColumns(cols);
          setHeading(cols);
          setColumnLabels(labels);
          const saved = JSON.parse(
            localStorage.getItem("reportColumns") || "{}"
          );
          saved[id] = { visible: cols, labels };
          localStorage.setItem("reportColumns", JSON.stringify(saved));
        }}
        onClose={() => setIsColumnModal(false)}
      />
    </>
  );
};

export default Report;
