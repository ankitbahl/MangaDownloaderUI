import './App.css';

import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./components/Login.js";
import MangaList from "./components/MangaList.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/manga-list" element={<MangaList />} />
        <Route exact path="/login-page" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
