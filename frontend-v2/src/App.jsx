import { Analytics } from "@vercel/analytics/react";
import AppRoutes from "./app/routes";
import ScrollToTop from "./components/navigation/ScrollToTop";
import { beforeSendAnalytics, isAnalyticsEnabled } from "./utils/analytics";

function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      {isAnalyticsEnabled() && <Analytics beforeSend={beforeSendAnalytics} debug={false} />}
    </>
  );
}

export default App;
