import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import fileList from '/public/fileList.json';

function Footer() {
  const updatedAt = new Date(fileList.updatedAt).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#1976d2",
        color: "#fff",
        py: 2,
        textAlign: "center",
        mt: "auto",
      }}
    >
      <Typography variant="body2">
        <div>
          <Link to="/GAPolicy" style={{color:"#ffff"}}>
            ※Google Analyticsで解析を行ってます
          </Link>
        </div>
        <div>
          最終更新日: {updatedAt}
        </div>
        <div>
          サイト管理者：わくせい・わほい
        </div>
        <div>
          問い合わせメールアドレス:wahoijbusiness2025@gmail.com
        </div>
      </Typography>
    </Box>
  );
}

export default Footer;