import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import EnhancedTrackingLayer from "../components/EnhancedTrackingLayer";

const EnhancedTrackingPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Enhanced Tracking" />
      <EnhancedTrackingLayer />
    </MasterLayout>
  );
};

export default EnhancedTrackingPage;
