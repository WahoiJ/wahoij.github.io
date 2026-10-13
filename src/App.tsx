import { HashRouter as Router, Routes, Route, Outlet, Link } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react"; // ← 追加
import VendingMachine from "./contents/VendingMachine";
import Header from "./fragments/Header";
import Footer from "./fragments/Footer";
import BikeArticle from "./contents/Bike";
import GAPolicy from "./contents/GAPolicy";
import Blog from "./contents/Blog";
import Analytics from "./fragments/Analytics";
import { Box, Typography } from "@mui/material";
import "./App.css";

// 管理画面は閲覧者には不要なので別チャンクで読み込む
const Admin = lazy(() => import("./admin/Admin"));

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
  type NewArticle = {
    name: string;
    title?: string | null;
    folder: string;
    createdAt: string;
  };
  const [newArticles, setNewArticles] = useState<NewArticle[]>([]);
  const [newBlogPosts, setNewBlogPosts] = useState<NewArticle[]>([]);

  // ← fetchを追加
  useEffect(() => {
    fetch('/newArticles.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setNewArticles(data.newArticles || []))
      .catch(() => setNewArticles([]));
    fetch('/blogNewArticles.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setNewBlogPosts(data.newArticles || []))
      .catch(() => setNewBlogPosts([]));
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
        <p>
          <Link to="/Blog" style={{ fontSize: '1.2rem' }}>📝 ブログ</Link>
        </p>
      </Box>

      {/* 新着記事 */}
      {(newArticles.length > 0 || newBlogPosts.length > 0) && (
        <Box sx={{ backgroundColor: '#fff3cd', p: 2, mt: 3, mx: 'auto', maxWidth: 600 }}>
          <Typography variant="h6">🆕 新着記事</Typography>
          {newBlogPosts.map((post, i) => (
            <div key={`blog-${i}`}>
              <Link to={`/Blog/${post.name.replace('.md', '')}`}>
                [ブログ] {post.title || post.name.replace('.md', '')}
              </Link>
              {new Date(post.createdAt).toLocaleDateString('ja-JP')}
            </div>
          ))}
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
      <Analytics />
      <div id="root">
        <header></header>
        <main>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Portal />} />
              <Route path="Vending" element={<VendingMachine />} />
              <Route path="Bike/*" element={<BikeArticle />} />
              <Route path="Blog/*" element={<Blog />} />
              <Route
                path="Admin"
                element={
                  <Suspense fallback={<p style={{ textAlign: "center" }}>読み込み中…</p>}>
                    <Admin />
                  </Suspense>
                }
              />
              <Route path="GAPolicy" element={<GAPolicy />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;