const fs = require("fs");
const path = require("path");

// コマンドライン引数を取得
const args = process.argv.slice(2);

// デフォルト値
const defaultMdDir = "public/bike/md";
const defaultOutput = "public/fileList.json";

// 引数から値を取得
const mdDirArg = args[0] || defaultMdDir;
const outputFileArg = args[1] || defaultOutput;

// パスを結合
const mdDir = path.join(__dirname, mdDirArg);
const outputFile = path.join(__dirname, outputFileArg);

// ディレクトリを再帰的にスキャンしてMarkdownファイルを取得
const scanDirectory = (dirPath, basePath = "") => {
    const result = {};
    
    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            const relativePath = basePath ? path.join(basePath, item.name) : item.name;
            
            if (item.isDirectory()) {
                // サブディレクトリを再帰的にスキャン
                const subResult = scanDirectory(fullPath, relativePath);
                Object.assign(result, subResult);
            } else if (item.isFile() && item.name.endsWith('.md')) {
                // Markdownファイルを見つけた場合
                const dirKey = basePath || "root";
                if (!result[dirKey]) {
                    result[dirKey] = [];
                }
                result[dirKey].push(item.name);
            }
        }
    } catch (error) {
        console.error(`ディレクトリの読み込みエラー: ${dirPath}`, error);
    }
    
    return result;
};

const generateFileList = () => {
    try {
        console.log(`スキャン対象: ${mdDir}`);
        
        const fileStructure = scanDirectory(mdDir);
        
        // ファイルリストをソート
        Object.keys(fileStructure).forEach(key => {
            fileStructure[key].sort((a, b) => {
                // 数字ファイルを数値順にソート
                const aNum = parseInt(a.replace('.md', ''));
                const bNum = parseInt(b.replace('.md', ''));
                
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum;
                }
                return a.localeCompare(b);
            });
        });

        fs.writeFileSync(outputFile, JSON.stringify(fileStructure, null, 2));
        console.log(`ファイルリストを生成しました: ${outputFile}`);
        console.log('生成された構造:');
        console.log(JSON.stringify(fileStructure, null, 2));
    } catch (error) {
        console.error("ファイルリストの生成中にエラーが発生しました:", error);
    }
};

generateFileList();