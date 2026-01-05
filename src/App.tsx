import { BrowserRouter, Routes, Route } from "react-router-dom";
import ComingSoon from "./pages/ComingSoon";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="*" element={<ComingSoon />} />
    </Routes>
  </BrowserRouter>
);

export default App;
