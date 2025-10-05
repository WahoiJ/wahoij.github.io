import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";


function NextPage() {
    const location = useLocation();
    const [fileList, setFileList] = useState<string[]>([]);
    const [nextPageExists, setNextPageExists] = useState(false); // 次のページが存在するかどうかの状態
    const [prevPageExists, setPrevPageExists] = useState(false); // 前のページが存在するかどうかの状態
    const nextLocation: number = Number(location.pathname.replace(/^.*\//, "").replace(".md", ""));
    const currentLocation: string = location.pathname.replace(/\/[^/]*$/, "");
    const currentFiles = currentLocation.replace(/^.*\//, "");
    const NextPageLink: string = `${currentLocation}/${nextLocation + 1}.md`
    const PrevPageLink: string = `${currentLocation}/${nextLocation - 1}.md`; // 前のページのリンク
    useEffect(() => {
        // ファイルリストを取得
        const fetchFileList = async () => {
            const response = await fetch("/fileList.json");
            const data = await response.json();
            setFileList(data[currentFiles] || []);
        };

        fetchFileList();
    }, [currentFiles]);

    useEffect(() => {
        setNextPageExists(fileList.includes(`${nextLocation + 1}.md`));
        setPrevPageExists(fileList.includes(`${nextLocation - 1}.md`));
    }, [fileList, nextLocation]);

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
            <BacktoTop currentLocation={currentLocation}/>
        </>
    );
}

function BacktoTop({ currentLocation }: { currentLocation: string }) {
    console.log(currentLocation)

    return (
        <>
        {currentLocation!=="/Bike" ? (
            <>
            <div><Link to="/Bike/Link.md">自転車記事一覧</Link></div>
                <div><Link to="/">トップ画面へ</Link></div>
            </>
        ) :(
            <>
                <Link to="/">トップ画面へ</Link>
            </>
            )
        }
        </>
    );
}

export default NextPage;