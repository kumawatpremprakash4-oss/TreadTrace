import React from "react";
import { FourWheelDigitalTwinPage } from "./FourWheelDigitalTwinPage";

export const TyreRearRightPage: React.FC<{ sessionId?: string; maxLaps?: number }> = ({ sessionId, maxLaps }) => {
  return <FourWheelDigitalTwinPage initialCorner="RR" sessionId={sessionId} maxLaps={maxLaps} />;
};
