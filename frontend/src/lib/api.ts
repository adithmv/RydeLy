// Existing backend contracts are preserved; demo mode is the default.
import * as mock from "../mock/api";
import * as backend from "./backend";
export type {
  Driver,
  CallLog,
  AdminDriver,
  AdminUser,
  AdminLog,
  AdminReport,
} from "./backend";
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";
const api = DEMO_MODE ? mock : backend;
export const {
  verifyToken,
  setName,
  logoutApi,
  getDrivers,
  initiateCall,
  reportDriver,
  getCallHistory,
  setAvailability,
  registerDriver,
  reportCommuter,
  adminGetDrivers,
  adminGetUsers,
  adminGetLogs,
  adminGetReports,
  adminVerifyDriver,
  adminWarn,
  adminRemove,
  adminResolveReport,
  getAnnouncements,
  getDriverProfile,
  postAnnouncement,
} = api;
