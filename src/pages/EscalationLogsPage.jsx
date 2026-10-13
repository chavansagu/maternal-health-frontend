import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import EscalationLogsLayer from "../components/EscalationLogsLayer";

const EscalationLogsPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Escalation Log" />
      <EscalationLogsLayer />
    </MasterLayout>
  );
};

export default EscalationLogsPage;
