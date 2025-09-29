import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";



const comment = {

  VM1: `2020年の夏に甲府で見つけた自販機。
70円で500mlのZONEとペプシが買えるの!?と小躍りしながら小銭を入れた記憶
ちなみに次の年行ったら商品が変わってた。ランダム性高い。`,

  VM2: `2022年6月石川県七尾市あたりで発見したエロ本自販機。
すっかり淘汰されたと思っていたので見つけたときは感激した。
2枚目の酒用自販機はもう廃れていたがメインの18禁本は健在だった。
一応写真は撮ったがなんかコンプラ的にめんどくさそうなので載せないでおく。`,

  VM3: `2022年石川県小松駅近くのアーケード街内部にあったストッキング自販機。
なぜこんな大量にストッキングばかりを並べているのか.
そんなに需要があるのか…考えたが理解不能だった。`,

  VM4: `2019年5月頃たしか秋葉原駅構内で見かけた一円単位で料金が設定されている自販機。
確かにIC専用にすれば端数出ても問題ないか。`,

  VM5: `2019年5月に大阪で撮った自販機。
大阪名物安い缶ジュースを初めてみて感動した。`,

  VM6: `同じく2019年5月に大阪で撮った自販機。
街角の自販機で紙パックは珍しいなと思って撮ったはず。`,


  VM7: `2019年8月関空の貸しロッカー
1枚目を撮影した日から3日位したら2枚目の状態になってた。
全部小銭で入れないといけないから大変そうだ…。`,


  VM8: `同じく2019年8月の関空の自動チェックインカウンター
今まで乗ったことある飛行機全部有人カウンターだったから新鮮だった。
割と最近増えているらしい？`,

  VM9: `2019年8月台湾の電気街あたりで撮った自販機。
Mastercardのロゴが入った自販機って日本にあったっけ？
※これから5年後日本でもクレジットカード決済の端末が増えて時代を感じる
`,

  VM10: `見つけると嬉しい180円モンスターエナジー
噂によると170円以下もあるらしいがまだ見たことがない。
※2023年以降の値上げラッシュでこの価格すら見られなくなってしまった……
`,

  VM11: `2019年7月に京都の伏見稲荷神社で撮った自販機。
この頃五輪前なので一気に自販機が観光仕様に変わっていた
そういえば公衆トイレ用のティッシュの自販機もあったが撮り忘れていた。(腹が痛かったのでそれどころではなかったけど)`,

// コメントエリア

};

const imageData = [

  { file: "VM1_1.jpg", description: comment.VM1 },
  { file: "VM1_2.jpg", description: comment.VM1 },
  { file: "VM2_1.jpg", description: comment.VM2 },
  { file: "VM2_2.jpg", description: comment.VM2 },
  { file: "VM3.jpg", description: comment.VM3 },
  { file: "VM4.jpg", description: comment.VM4 },
  { file: "VM5.jpg", description: comment.VM5 },
  { file: "VM6.jpg", description: comment.VM6 },
  { file: "VM7_1.jpg", description: comment.VM7 },
  { file: "VM7_2.jpg", description: comment.VM7 },
  { file: "VM8.jpg", description: comment.VM8 },
  { file: "VM9.jpg", description: comment.VM9 },
  { file: "VM10.jpg", description: comment.VM10 },
  { file: "VM11.jpg", description: comment.VM11 },


  // 必要なファイル名追加
];

const images = imageData.map(function (item) {
  return {
    original: `/VM_images/${item.file}`,
    thumbnail: `/VM_images/${item.file}`,
    description: item.description,
  };
});

function VendingMachine() {
  return (
    <div>
      <ImageGallery
              sizes="(min-width: 960px) 33vw, (min-width: 640px) 50vw, 100vw"
       items={images} />
    </div>
  );
}

export default VendingMachine;