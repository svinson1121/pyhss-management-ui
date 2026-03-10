import axios from "axios";

// Create instance with interceptor that reads localStorage on every request
// so API URL / token changes in settings take effect immediately
const http = axios.create({
  headers: { "Content-type": "application/json" }
});

http.interceptors.request.use((config) => {
  config.baseURL = localStorage.getItem("api") || "http://localhost:8080";
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Provisioning-Key"] = token;
  } else {
    delete config.headers["Provisioning-Key"];
  }
  return config;
});

export default http;
