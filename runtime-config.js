/* Public GitHub Pages configuration. Never put a secret in this file. */
const localHost = String(window.location.hostname || "").toLowerCase().replace(/\.$/, "");
const localGateway = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(localHost)
  ? "http://127.0.0.1:8787"
  : "";

window.YINGJIE_CONFIG = {
  // Local previews explicitly use the private gateway. Published sites must set
  // an HTTPS URL here; no secret may be placed in this static file.
  // Never add secrets here.
  studioApiBaseUrl: localGateway,
  videoApiBaseUrl: localGateway,
  projectId: "yesterday-signal-ep01"
};
