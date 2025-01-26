import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogsTabs } from "@/components/logs/LogsTabs";
import { AuditLogsList } from "@/components/logs/AuditLogsList";
import MonitoringLogsList from "@/components/logs/MonitoringLogsList";
import { DebugConsole } from "@/components/logs/DebugConsole";
import { useState } from "react";
import { LOGS_TABS, LogsTabsType } from "@/constants/logs";
import AuditActivityChart from "@/components/system/metrics/AuditActivityChart";

const SystemAuditView = () => {
  const [activeTab, setActiveTab] = useState<LogsTabsType>(LOGS_TABS.AUDIT);
  const [debugLogs] = useState([
    'Audit system initialized',
    'Real-time monitoring active'
  ]);

  return (
    <div className="space-y-6">
      <Card className="bg-dashboard-card border-white/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">System Audit & Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AuditActivityChart />
          
          <div className="space-y-4">
            <LogsTabs 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
            
            {activeTab === LOGS_TABS.AUDIT && <AuditLogsList />}
            {activeTab === LOGS_TABS.MONITORING && <MonitoringLogsList />}
          </div>

          <DebugConsole logs={debugLogs} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAuditView;