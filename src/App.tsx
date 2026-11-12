import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import Header from "./fragments/Header";
import Footer from "./fragments/Footer";
import BikeArticle from "./contents/Bike";
import GAPolicy from "./contents/GAPolicy";
import Blog from "./contents/Blog";
import Gallery from "./contents/Gallery";
import Analytics from "./fragments/Analytics";
import NotFound from "./contents/NotFound";
import Home from "./contents/Home";
import { usePageMeta } from "./seo/usePageMeta";
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
              <Route index element={<Home />} />
              <Route
                path="Vending/*"
                element={
                  <Page title="自販機コレクション" description="旅先や街角で見つけた、ちょっと変わった自動販売機の写真集です。激安ジュースや1円単位の自販機、ストッキング自販機などを紹介。">
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
                  <Page title="Google Analyticsについて" description="当サイトでのアクセス解析ツール Googleアナリティクスの利用と、Cookie によるデータ収集・無効化の方法について説明します。">
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