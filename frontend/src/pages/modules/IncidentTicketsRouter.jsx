import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import TechnicianPortal from "../dashboards/TechnicianPortal";
import IncidentTicketsUser from "./IncidentTickets";

/**
 * Routes to appropriate component based on user role
 * - TECHNICIAN: Shows full technical portal with assigned tickets management
 * - Others: Shows incident tickets module for reporting/creating tickets
 */
const IncidentTicketsRouter = () => {
  const { user } = useContext(AuthContext);

  if (user?.role === "TECHNICIAN") {
    return <TechnicianPortal />;
  }

  return <IncidentTicketsUser />;
};

export default IncidentTicketsRouter;
