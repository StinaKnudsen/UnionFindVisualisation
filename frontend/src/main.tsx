import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import Landing from "./pages/landingPage";
import UFBuilderPage from "./pages/UFBuilderPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/builder/:ufType" element={<UFBuilderPage />} />
      </Routes>
    </Router>
  </StrictMode>
);