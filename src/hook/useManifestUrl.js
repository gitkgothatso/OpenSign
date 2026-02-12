import { useEffect, useMemo } from "react";

export function useManifestUrl(appName, logo) {
  const url = useMemo(() => {
    const start_url = window.location.origin || ".";
    const manifest = {
      short_name: appName,
      name: appName,
      start_url: start_url,
      display: "standalone",
      theme_color: "#000000",
      background_color: "#ffffff",
      ...(logo && {
        icons: [
          // For data URLs (base64), omit sizes to avoid browser warnings
          // The browser will determine the size automatically
          logo.startsWith("data:") 
            ? { src: logo, type: "image/png" }
            : { src: logo, type: "image/png", sizes: "any" }
        ]
      })
    };
    const blob = new Blob([JSON.stringify(manifest)], {
      type: "application/json"
    });
    return URL.createObjectURL(blob);
  }, [appName, logo]);

  useEffect(() => {
    // cleanup when unmounting or when url changes
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}
