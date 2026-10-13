import { BrowserRouter as Router, Routes, Route, Outlet, Link, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, lazy, Suspense, type ReactNode } from "react";
import Header from "./fragments/Header";
import Footer from "./fragments/Footer";
import BikeArticle from "./contents/Bike";
import GAPolicy from "./contents/GAPolicy";
import Blog from "./contents/Blog";
import Gallery from "./contents/Gallery";
import Analytics from "./fragments/Analytics";
import NotFound from "./contents/NotFound";
import { bikeUrl, blogUrl, galleryUrl } from "./seo/urls";
import { usePageMeta } from "./seo/usePageMeta";
import { SITE_DESCRIPTION } from "./seo/site";
import { Box, Typography } from "@mui/material";
import "./App.css";

// 管理画面は閲覧者には不要なので別チャンクで読み込む
const Admin = lazy(() => import("./admin/Admin"));
// 画像ギャラリーのライブラリが大きいので自販機ページも別チャンクに
const VendingMachine = lazy(() => import("./contents/VendingMachine"));

const loading = <p style={{ textAlign: "center" }}>読み込み中…</p>;

/** 固定ページ用：title / description を設定して中身を表示 */
function Page({ title, description, children }: { title?: string; description: string; children: ReactNode }) {
  usePageMeta({ title, description });
  return <Suspense fallback={loading}>{children}</Suspense>;
}

/** /Blog/hello → /Blog/hello/ のように末尾スラッシュに統一（.md などファイル名は除く） */
function TrailingSlash() {
  const { pathname, search, hash } = useLocation();
  const last = pathname.split("/").pop() ?? "";
  if (pathname.endsWith("/") || last.includes(".")) return null;
  return <Navigate to={`${pathname}/${search}${hash}`} replace />;
}

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
  usePageMeta({ description: SITE_DESCRIPTION });

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
        <h2>ポータル画面</h2>
        <p>見たいコンテンツを選んでください</p>
        <Link to="/Vending/">
          <img src="/assets/icons/VendingMachine.png" alt="自販機ページ" className="icon" />
        </Link>
        <Link to={bikeUrl()}>
          <img src="/assets/icons/Cycle.png" alt="自転車関連" className="icon" />
        </Link>
        <p>
          <Link to={blogUrl()} style={{ fontSize: '1.2rem' }}>📝 ブログ</Link>
          {'　'}
          <Link to={galleryUrl()} style={{ fontSize: '1.2rem' }}>📷 ギャラリー</Link>
        </p>
      </Box>

      {/* 新着記事 */}
      {(newArticles.length > 0 || newBlogPosts.length > 0) && (
        <Box sx={{ backgroundColor: '#fff3cd', p: 2, mt: 3, mx: 'auto', maxWidth: 600 }}>
          <Typography variant="h6">🆕 新着記事</Typography>
          {newBlogPosts.map((post, i) => (
            <div key={`blog-${i}`}>
              <Link to={blogUrl(post.name.replace('.md', ''))}>
                [ブログ] {post.title || post.name.replace('.md', '')}
              </Link>
              {new Date(post.createdAt).toLocaleDateString('ja-JP')}
            </div>
          ))}
          {newArticles.map((article, i) => (
            <div key={i}>
              <Link to={bikeUrl(`${article.folder}/${article.name}`)}>
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
      <TrailingSlash />
      <Analytics />
      <div id="root">
        <header></header>
        <main>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Portal />} />
              <Route
                path="Vending/*"
                element={
                  <Page title="自販機コレクション" description="旅先や街角で見つけた、ちょっと変わった自動販売機の写真集です。">
                    <VendingMachine />
                  </Page>
                }
              />
              <Route path="Bike/*" element={<BikeArticle />} />
              <Route path="Blog/*" element={<Blog />} />
              <Route path="Gallery/*" element={<Gallery />} />
              <Route
                path="Admin/*"
                element={
                  <Suspense fallback={loading}>
                    <Admin />
                  </Suspense>
                }
              />
              <Route
                path="GAPolicy/*"
                element={
                  <Page title="Google Analyticsについて" description="当サイトでのGoogleアナリティクスの利用とCookieについて。">
                    <GAPolicy />
                  </Page>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;