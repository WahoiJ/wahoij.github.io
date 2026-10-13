import { Link } from "react-router-dom";
import { usePageMeta } from "../seo/usePageMeta";

function NotFound() {
  usePageMeta({ title: "ページが見つかりません", noindex: true });
  return (
    <div style={{ textAlign: "center", padding: "32px 16px" }}>
      <h1>ページが見つかりません</h1>
      <p>URLが間違っているか、ページが移動・削除された可能性があります。</p>
      <Link to="/">トップ画面へ</Link>
    </div>
  );
}

export default NotFound;
