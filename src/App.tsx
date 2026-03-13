import { HashRouter as Router, Routes, Route, Outlet, Link } from "react-router-dom";
import { useState, useEffect } from "react"; // ← 追加
import VendingMachine from "./contents/VendingMachine";
import Header from "./fragments/Header";
import Footer from "./fragments/Footer";
import BikeArticle from "./contents/Bike";
import GAPolicy from "./contents/GAPolicy";
import { Box, Typography } from "@mui/material";
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
  const [newArticles, setNewArticles] = useState<{
    name: string;
    folder: string;
    createdAt: string;
  }[]>([]);

  // ← fetchを追加
  useEffect(() => {
    fetch('/newArticles.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setNewArticles(data.newArticles || []))
      .catch(() => setNewArticles([]));
  }, []);

  return (
    <>
      <Box textAlign="center" mt={5}>
        <h1>ポータル画面</h1>
        <p>見たいコンテンツを選んでください</p>
        <Link to="/Vending">
          <img src="/assets/icons/VendingMachine.png" alt="自販機ページ" className="icon" />
        </Link>
        <Link to="/Bike">
          <img src="/assets/icons/Cycle.png" alt="自転車関連" className="icon" />
        </Link>
      </Box>

      {/* 新着記事 */}
      {newArticles.length > 0 && (
        <Box sx={{ backgroundColor: '#fff3cd', p: 2, mt: 3, mx: 'auto', maxWidth: 600 }}>
          <Typography variant="h6">🆕 新着記事</Typography>
          {newArticles.map((article, i) => (
            <div key={i}>
              <Link to={`/Bike/${article.folder}/${article.name}`}>
                [{article.folder}] {article.name.replace('.md', '')}
              </Link>
              {new Date(article.createdAt).toLocaleDateString('ja-JP')}
            </div>
          ))}
        </Box>
      )}
    </>
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