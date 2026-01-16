import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles/dark-theme-improvements.css";
import App from "./App";
import { showUpgradeProgress, hideUpgradeProgress } from "./utils";
import { Provider } from "react-redux";
import { store } from "./redux/store";
// Parse SDK removed - using REST API with JWT authentication
import "./polyfills";
import { serverUrl_fn } from "./constant/appinfo";
import "./i18n";

// Parse configuration no longer needed
// const appId = import.meta.env.VITE_APPID || process.env.REACT_APP_APPID || "opensign";
// const serverUrl = serverUrl_fn();
// Parse initialization removed - application now uses REST API
// const appId = import.meta.env.VITE_APPID || process.env.REACT_APP_APPID || "opensign";
// const serverUrl = serverUrl_fn();

if (localStorage.getItem("showUpgradeProgress")) {
  showUpgradeProgress();
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "opensigndark");
}


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

hideUpgradeProgress();
localStorage.removeItem("showUpgradeProgress");
