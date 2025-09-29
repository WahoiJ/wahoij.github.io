import { HashRouter as Router, Routes, Route, Outlet, Link } from "react-router-dom";
import VendingMachine from "./contents/VendingMachine";
import Header from "./fragments/Header";
import Footer from "./fragments/Footer";
import BikeArticle from "./contents/Bike";
import GAPolicy from "./contents/GAPolicy";
import { Box } from "@mui/material";
import "./App.css";

function Layout() {
  return (
    <div className="layout-root">
      <Header />
      <div className="layout-main">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function Portal() {
  return (
    <Box textAlign="center" mt={5}>
      <h1>ポータル画面</h1>
      <p>見たいコンテンツを選んでください</p>
      <Link to="/Vending">
        <img
          src="/assets/icons/VendingMachine.png"
          alt="自販機ページ"
          className="icon"
        />
      </Link>
      <Link to="/Bike">
        <img
          src="/assets/icons/Cycle.png"
          alt="自転車関連"
          className="icon"
        />
      </Link>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <div id="root">
        <header></header>
        <main>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Portal />} />
              <Route path="Vending" element={<VendingMachine />} />
                  <Route path="Bike/*" element={<BikeArticle />} />
              <Route path="GAPolicy" element={<GAPolicy />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
