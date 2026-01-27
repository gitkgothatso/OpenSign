import Parse from "parse";

/**
 * Synchronize Parse SDK authentication after JWT login
 * This ensures Parse queries work while migrating from Parse to JWT backend
 */
export async function syncParseAuth() {
  try {
    // Check if Parse user is already logged in
    if (Parse.User.current()) {
      console.log("Parse SDK already authenticated");
      return true;
    }

    // Get JWT user data from localStorage
    const token = localStorage.getItem("accesstoken");
    const userEmail = localStorage.getItem("userEmail");
    
    if (!token || !userEmail) {
      console.warn("No JWT token found - Parse auth sync skipped");
      return false;
    }

    // Try to become the user using session token from Parse Server
    // This requires the user to have logged in through Parse at least once
    const parseSessionToken = localStorage.getItem("Parse/opensign/currentUser");
    
    if (parseSessionToken) {
      try {
        const sessionData = JSON.parse(parseSessionToken);
        if (sessionData.sessionToken) {
          await Parse.User.become(sessionData.sessionToken);
          console.log("Parse SDK authenticated via stored session");
          return true;
        }
      } catch (e) {
        console.warn("Failed to restore Parse session:", e.message);
      }
    }

    console.warn("Parse authentication not available - some features may not work");
    return false;
    
  } catch (error) {
    console.error("Parse auth sync error:", error);
    return false;
  }
}

/**
 * Check if Parse SDK is authenticated
 */
export function isParseAuthenticated() {
  return Parse.User.current() !== null;
}

/**
 * Get Parse session token if available
 */
export function getParseSessionToken() {
  return Parse.User.current()?.getSessionToken();
}
