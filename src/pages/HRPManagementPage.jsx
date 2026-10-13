import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import HRPManagementLayer from "../components/HRPManagementLayer";

const HRPManagementPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="High-Risk Pregnancy" />
      <HRPManagementLayer />
    </MasterLayout>
  );
};

export default HRPManagementPage;
