import React from "react";
import { FourWheelDigitalTwinPage } from "./FourWheelDigitalTwinPage";

export const TyreFrontLeftPage: React.FC<{ sessionId?: string; maxLaps?: number }> = ({ sessionId, maxLaps }) => {
  return <FourWheelDigitalTwinPage initialCorner="FL" sessionId={sessionId} maxLaps={maxLaps} />;
};
