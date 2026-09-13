import React from "react";
import { FourWheelDigitalTwinPage } from "./FourWheelDigitalTwinPage";

export const TyreFrontRightPage: React.FC<{ sessionId?: string; maxLaps?: number }> = ({ sessionId, maxLaps }) => {
  return <FourWheelDigitalTwinPage initialCorner="FR" sessionId={sessionId} maxLaps={maxLaps} />;
};
