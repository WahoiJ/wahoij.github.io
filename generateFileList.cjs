const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// コマンドライン引数を取得
const args = process.argv.slice(2);

// デフォルト値
const defaultMdDir = "public/bike/md";
const defaultOutput = "public/fileList.json";
const defaultNewArticlesOutput = "public/newArticles.json";

// 引数から値を取得
const mdDirArg = args[0] || defaultMdDir;
const outputFileArg = args[1] || defaultOutput;

// パスを結合
const mdDir = path.join(__dirname, mdDirArg);
const outputFile = path.join(__dirname, outputFileArg);
const newArticlesFile = path.join(__dirname, defaultNewArticlesOutput);

// gitの初回コミット日時を取得（投稿日）
const getGitCreatedAt = (filePath) => {
    try {
        const result = execSync(
            `git log --follow --diff-filter=A --format=%aI -- "${filePath}"`,
            { encoding: "utf-8" }
        ).trim();
        return result || null;
    } catch {
        return null;
    }
};

// gitの最終コミット日時を取得（更新日）
const getGitUpdatedAt = (filePath) => {
    try {
        const result = execSync(
            `git log -1 --format=%aI -- "${filePath}"`,
            { encoding: "utf-8" }
        ).trim();
        return result || null;
    } catch {
        return null;
    }
};

// ディレクトリを再帰的にスキャンしてMarkdownファイルを取得
const scanDirectory = (dirPath, basePath = "") => {
    const result = {};

    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            const relativePath = basePath ? path.join(basePath, item.name) : item.name;

            if (item.isDirectory()) {
                const subResult = scanDirectory(fullPath, relativePath);
                Object.assign(result, subResult);
            } else if (item.isFile() && item.name.endsWith(".md")) {
                const dirKey = basePath || "root";
                if (!result[dirKey]) result[dirKey] = [];

                const createdAt = getGitCreatedAt(fullPath);
                const updatedAt = getGitUpdatedAt(fullPath);

                console.log(`  ${item.name}: 投稿日=${createdAt}, 更新日=${updatedAt}`);
                result[dirKey].push({ name: item.name, createdAt, updatedAt });
            }
        }
    } catch (error) {
        console.error(`ディレクトリの読み込みエラー: ${dirPath}`, error);
    }

    return result;
};

// 新着記事を検出してnewArticles.jsonを生成
const detectNewArticles = (newFiles) => {
    // 旧fileList.jsonを読み込む（なければ空扱い＝初回は全件新着）
    let oldFiles = {};
    try {
        const old = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
        oldFiles = old.files || {};
    } catch {
        console.log("  旧fileList.jsonなし（初回生成）");
    }

    // 差分検出：新しく増えたファイルを抽出
    const newArticles = [];
    for (const [folder, articles] of Object.entries(newFiles)) {
        const oldNames = (oldFiles[folder] || []).map((f) => f.name);
        for (const article of articles) {
            if (!oldNames.includes(article.name)) {
                newArticles.push({
                    name: article.name,
                    folder,
                    createdAt: article.createdAt,
                });
                console.log(`  新着検出: [${folder}] ${article.name}`);
            }
        }
    }

    fs.writeFileSync(
        newArticlesFile,
        JSON.stringify({ updatedAt: new Date().toISOString(), newArticles }, null, 2)
    );

    console.log(`✅ 新着記事: ${newArticles.length}件 → ${newArticlesFile}`);
};

const generateFileList = () => {
    try {
        console.log(`\nスキャン対象: ${mdDir}`);

        const fileStructure = scanDirectory(mdDir);

        // ファイルリストをソート
        Object.keys(fileStructure).forEach((key) => {
            fileStructure[key].sort((a, b) => {
                const aNum = parseInt(a.name.replace(".md", ""));
                const bNum = parseInt(b.name.replace(".md", ""));
                if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                return a.name.localeCompare(b.name);
            });
        });

        // ① 先に差分検出（旧fileList.jsonと比較するため、上書き前に実行）
        console.log("\n新着記事を検出中...");
        detectNewArticles(fileStructure);

        // ② fileList.jsonを更新
        fs.writeFileSync(
            outputFile,
            JSON.stringify({ updatedAt: new Date().toISOString(), files: fileStructure }, null, 2)
        );

        console.log(`\n✅ fileList.jsonを生成しました: ${outputFile}`);
    } catch (error) {
        console.error("ファイルリストの生成中にエラーが発生しました:", error);
    }
};

generateFileList();
