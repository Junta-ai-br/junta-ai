import AppRoutes from "./app/routes";

function App() {
  return <AppRoutes />;
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