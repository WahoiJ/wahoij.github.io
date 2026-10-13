import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { bikeUrl } from "../seo/urls";

/** 自転車記事の前後ページへのリンク（ファイル名が連番のフォルダ用） */
function NextPage({ folder, name }: { folder?: string; name?: string }) {
  const [fileList, setFileList] = useState<string[]>([]);
  const current = Number(name);
  const numbered = folder !== undefined && name !== undefined && !Number.isNaN(current);

  useEffect(() => {
    if (!folder) return;
    fetch("/fileList.json")
      .then((res) => res.json())
      .then((data) => setFileList((data.files[folder] || []).map((f: { name: string }) => f.name)))
      .catch(() => setFileList([]));
  }, [folder]);

  const prevExists = numbered && fileList.includes(`${current - 1}.md`);
  const nextExists = numbered && fileList.includes(`${current + 1}.md`);

  return (
    <>
      <div>{prevExists && <Link to={bikeUrl(`${folder}/${current - 1}`)}>前のページへ</Link>}</div>
      <div>{nextExists && <Link to={bikeUrl(`${folder}/${current + 1}`)}>次のページへ</Link>}</div>
      {folder ? (
        <>
          <div>
            <Link to={bikeUrl()}>自転車記事一覧</Link>
          </div>
          <div>
            <Link to="/">トップ画面へ</Link>
          </div>
        </>
      ) : (
        <Link to="/">トップ画面へ</Link>
      )}
    </>
  );
}

export default NextPage;
