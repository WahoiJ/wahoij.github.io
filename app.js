const express=require('express');
const app=express();

//パスの設定
const path=require('path');
app.use(express.static(path.join(__dirname,'view')));

//pubilcフォルダ内のファイルも読み込めるようにする。
app.use(express.static('public'));

app.get('/',(req,res)=>{
    res.render('index.html');
});

app.listen(3000);