import React from "react";
import { Link , useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  return isHome ?
    ( 
    <Link to="https://ja.wikipedia.org/wiki/%E3%83%9F%E3%83%B3%E3%83%9F%E3%83%B3%E3%82%BC%E3%83%9F">
      <header style={{ background: "#1976d2", color: "#fff", padding: "16px 0", marginBottom: "24px" }}>
        <h1 style={{ margin: 0, textAlign: "center", fontSize: "2rem" }}>ミンミンゼミの最終定理</h1>
        <p style={{ margin: "8px 0 0 0", textAlign: "center", fontSize: "1rem" }}>
          ようこそ、表層ウェブの深淵へ！
        </p>
      </header>
    </Link>
    ) :
    (
      <Link to="/">
        <header style={{ background: "#1976d2", color: "#fff", padding: "16px 0", marginBottom: "24px" }}>
          <h1 style={{ margin: 0, textAlign: "center", fontSize: "2rem" }}>ミンミンゼミの最終定理</h1>
          <p style={{ margin: "8px 0 0 0", textAlign: "center", fontSize: "1rem" }}>
            ようこそ、表層ウェブの深淵へ！
          </p>
        </header>
      </Link>
    );
}

export default Header;