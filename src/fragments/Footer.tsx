import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";

function Footer() {
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
          <Link to ="/GAPolicy" style={{color:"#ffff"}}>
          ※Google Analyticsで解析を行ってます
          </Link>
        </div>
        <div>
        最終更新日:{new Date().toLocaleDateString()} 
        </div>
        <div >
        サイト管理者：わくせい
        </div>
        <div>
        問い合わせメールアドレス:wahoijbusiness2025@gmail.com
       </div>
      </Typography>
    </Box>
  );
}

export default Footer;