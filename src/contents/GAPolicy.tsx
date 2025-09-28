import { Box, Typography, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";


function GAPolicy() {
  return (
    <Box maxWidth={700} mx="auto" my={4}>
      <Typography variant="h4" component="h1" gutterBottom>
        GoogleAnalyticsについて
      </Typography>
      <Typography paragraph sx={{ lineHeight: 1.3 }}>
        当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を使用しています。このGoogleアナリティクスはデータの収集のためにCookieを使用しています。このデータは匿名で収集されており、個人を特定するものではありません。
      </Typography>
      <Typography paragraph sx={{ lineHeight: 1.3 }}>
        この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。この規約に関しての詳細は
        <MuiLink href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer">
          Googleアナリティクスサービス利用規約
        </MuiLink>
        のページや
        <MuiLink href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer">
          Googleポリシーと規約
        </MuiLink>
        ページをご覧ください。
      </Typography>
      <Box mt={4}>
        <RouterLink to="/" style={{ textDecoration: "underline" }}>
          トップへ
        </RouterLink>
      </Box>
    </Box>
  );
}

export default GAPolicy;