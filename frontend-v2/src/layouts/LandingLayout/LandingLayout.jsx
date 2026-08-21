import { Outlet } from "react-router-dom";

import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";

import { useTheme } from "@/contexts/useTheme";

import "./LandingLayout.css";

function LandingLayout() {
  const { isSwitching } = useTheme();

  return (
    <div
      className={[
        "landing-layout",
        isSwitching && "theme-switching",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Header />

      <main>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default LandingLayout;