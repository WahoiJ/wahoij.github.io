// ヘッダーの読み込み
fetch("include/header.html")
  .then((response) => response.text())
  .then((data) => {
    document.querySelector("#header").innerHTML = data;
  });

// フッターの読み込み
fetch("include/footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.querySelector("#footer").innerHTML = data;
  });