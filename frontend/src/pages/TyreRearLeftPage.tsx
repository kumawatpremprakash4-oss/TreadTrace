import React from "react";
import { FourWheelDigitalTwinPage } from "./FourWheelDigitalTwinPage";

export const TyreRearLeftPage: React.FC<{ sessionId?: string; maxLaps?: number }> = ({ sessionId, maxLaps }) => {
  return <FourWheelDigitalTwinPage initialCorner="RL" sessionId={sessionId} maxLaps={maxLaps} />;
};
