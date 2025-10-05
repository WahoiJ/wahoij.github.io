import { Link, useLocation } from "react-router-dom";
import FC2Counter from "./FC2Counter";

function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isBike = /^\/Bike(\/.*)?$/.test(location.pathname);

  const linkURL = isHome ? "https://ja.wikipedia.org/wiki/%E3%83%9F%E3%83%B3%E3%83%9F%E3%83%B3%E3%82%BC%E3%83%9F" : "/";
  const headerTitle = isBike ? "淋しい日々にはチャリを組め" : "ミンミンゼミの最終定理";
  console.log(location.pathname);
  return (
    <header style={{ background: "#1976d2", color: "#fff", padding: "16px 0", marginBottom: "24px" }}>
      <Link to={linkURL}>
        <h1 style={{ margin: 0, textAlign: "center", fontSize: "2rem" }}>{headerTitle}</h1>
        <p style={{ margin: "8px 0 0 0", textAlign: "center", fontSize: "1rem" }}>
          ようこそ、表層ウェブの深淵へ！
        </p>
            <FC2Counter style={{ margin: 0, textAlign: "center", fontSize: "2rem" }}/>
      </Link>
    </header>
  );
}

export default Header;