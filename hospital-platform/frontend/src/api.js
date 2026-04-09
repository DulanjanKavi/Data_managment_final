const BASE = "http://localhost:8000/api";

let _onUnauthorized = null;

// Always read token fresh from sessionStorage on every request
const getToken = () => sessionStorage.getItem("cnh_token");

export const api = {
  setToken: (t) => {
    sessionStorage.setItem("cnh_token", t);
  },
  clearToken: () => {
    sessionStorage.removeItem("cnh_token");
  },
  onUnauthorized: (fn) => { _onUnauthorized = fn; },
};

async function req(method, path, body) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  console.log(`DEBUG: ${method} ${path} | token=${token ? "present" : "MISSING"}`);

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401 && _onUnauthorized) {
    _onUnauthorized();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }

  if (res.status === 204) return null;
  return res.json();
}

const get  = (path)       => req("GET",   path);
const post = (path, body) => req("POST",  path, body);
const patch= (path, body) => req("PATCH", path, body);
const put  = (path, body) => req("PUT",   path, body);
const del  = (path)       => req("DELETE",path);

// ── Auth ──────────────────────────────────────────────────
export const login    = (email, password, role) => post("/auth/login", { email, password, role });
export const register = (data)                  => post("/auth/register", data);
export const getMe    = ()                      => get("/auth/me");

// ── Doctors ───────────────────────────────────────────────
export const getDoctors = ()          => get("/doctors");
export const getSlots   = (id, date)  => get(`/doctors/${id}/slots?date=${date}`);



// ── Schedule (doctor) ─────────────────────────────────────
export const getSchedule    = ()              => get("/schedule");
export const updateWeekly   = (weekly)        => put("/schedule/weekly", { weekly });
export const setOverride    = (date, slots)   => put("/schedule/override", { date, slots });
export const deleteOverride = (date)          => del(`/schedule/override/${date}`);

// ── Admin ─────────────────────────────────────────────────
export const getStats             = ()     => get("/admin/stats");
export const adminGetDoctors      = ()     => get("/admin/doctors");
export const adminAddDoctor       = (data) => post("/admin/doctors", data);
export const adminToggleDoctor    = (id)   => patch(`/admin/doctors/${id}/toggle`);
export const adminGetPatients     = ()     => get("/admin/patients");
export const adminGetAppointments = ()     => get("/admin/appointments");


// ── Appointments ──────────────────────────────────────────
export const getAppointments   = ()        => get("/appointments");
export const bookAppointment   = (data)    => post("/appointments", data);
export const updateAppointment = (id, s)   => patch(`/appointments/${id}`, { status: s });
export const getMyPatients     = ()        => get("/appointments/patients/mine");  // ← add this