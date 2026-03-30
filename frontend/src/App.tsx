import { BrowserRouter, Routes, Route } from "react-router-dom";
import UFBuilderPage from "./pages/UFBuilderPage";


// ADD HOMEPAGE ENDPOINT
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<>Home</>} />
        <Route path="/ufType/:ufType" element={<UFBuilderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;