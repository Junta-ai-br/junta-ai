import AppRoutes from "./app/routes";
import ScrollToTop from "./components/navigation/ScrollToTop";

function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
    </>
  );
}

export default App;