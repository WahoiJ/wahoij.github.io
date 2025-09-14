import { BrowserRouter as Router, Routes, Route, Outlet, Link } from "react-router-dom";
import VendingMachine from "./contents/VendingMachine";
import Header from "./fragments/Header";
import Footer from "./fragments/Footer";
import BikeArticle from "./contents/Bike";
import GAPolicy from "./contents/GAPolicy";
import { Box } from "@mui/material";

function Layout() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Header />
      <Box
        flex={1}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        width="100vw"
        maxWidth="100vw"
        minHeight={0}
        px={{ xs: 2, sm: 4 }}
        py={{ xs: 2, sm: 4 }}
        boxSizing="border-box"
      >
        <Box
          width="100%"
          maxWidth={500}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Outlet />
        </Box>
      </Box>
      <Footer />
    </Box>
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
          style={{ width: 80, height: 80, cursor: "pointer" }}
        />
      </Link>
      <Link to="/Bike">
        <img
          src="/assets/icons/Cycle.png"
          alt="自転車関連"
          style={{ width: 80, height: 80, cursor: "pointer" }}
        />
      </Link>

    </Box>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Portal />} />
          <Route path="Vending" element={<VendingMachine />} />
          <Route path="Bike" element={<BikeArticle />} />
          <Route path="GAPolicy" element={<GAPolicy />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;