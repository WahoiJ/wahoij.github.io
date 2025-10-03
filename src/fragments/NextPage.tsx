import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";


function NextPage() {
    const location = useLocation();
    const [nextPageExists, setNextPageExists] = useState(false); // 次のページが存在するかどうかの状態
    const [prevPageExists, setPrevPageExists] = useState(false); // 前のページが存在するかどうかの状態

    const nextLocation: number = Number(location.pathname.replace(/^.*\//, "").replace(".md", ""));
    const currentLocation: string = location.pathname.replace(/\/[^/]*$/, "");
    const NextPageLink: string = `${currentLocation}/${nextLocation + 1}.md`
    const PrevPageLink: string = `${currentLocation}/${nextLocation - 1}.md`; // 前のページのリンク

    useEffect(() => {
        const checkNextPageExists = async () => {
            try {
                const response = await fetch(NextPageLink, { method: "HEAD" ,cache: "no-store",}); // HEADリクエストで存在確認
                setNextPageExists(response.ok); // ステータスコードが200なら存在
            } catch {
                setNextPageExists(false); // エラーが発生した場合は存在しないとみなす
            }
        };
        const checkPrevPageExists = async () => {
            try {
                const response = await fetch(PrevPageLink, { method: "HEAD" }); // HEADリクエストで存在確認
                setPrevPageExists(response.ok); // ステータスコードが200なら存在
            } catch {
                setPrevPageExists(false); // エラーが発生した場合は存在しないとみなす
            }
        };
        checkNextPageExists();
        checkPrevPageExists();
    }, [NextPageLink, PrevPageLink]);


    return (
        <>
                <div>
            {prevPageExists ? (
                <Link to={PrevPageLink}>
                    前のページへ
                </Link>
            ) :
                null
            }
        </div>
        <div>
            {nextPageExists ? (
                <Link to={NextPageLink}>
                    次のページへ
                </Link>
            ) :
                null
            }
        </div>
        <h1>test</h1>
        </>
    );
}

export default NextPage;