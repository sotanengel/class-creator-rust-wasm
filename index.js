import init, { generate_struct_from_csv } from './pkg/rust_struct_creator_wasm.js';

window.addEventListener('DOMContentLoaded', async (event) => {
    const fileInput = document.getElementById('file-input');
    const output = document.getElementById('output');
    const codeBlock = document.getElementById('code-block');
    const downloadBtn = document.getElementById('download-btn');
    const reOutputBtn = document.getElementById('re-output-btn');

    let csvContent = '';

    // クエリパラメータからラジオボタンの状態を取得
    const params = new URLSearchParams(window.location.search);
    const implOption = params.get('impl-option') || 'include'; // デフォルトは 'include'

    // ラジオボタンの選択状態をセット
    document.querySelector(`input[name="impl-option"][value="${implOption}"]`).checked = true;

    // ファイル選択時にCSVを読み込む
    if (fileInput) {
        fileInput.addEventListener('change', async function() {
            const reader = new FileReader();
    
            reader.onload = async function(event) {
                csvContent = event.target.result;
                await generateStruct();
            };
    
            reader.readAsText(this.files[0]);
        });
    }

    // ラジオボタンの状態をクエリパラメータに保存
    const saveRadioStateToURL = () => {
        const selectedValue = document.querySelector('input[name="impl-option"]:checked').value;
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('impl-option', selectedValue);
        history.replaceState(null, '', `?${newParams.toString()}`); // URLを更新
    };

    // 構造体生成の処理
    const generateStruct = async () => {
        if (!csvContent) return;

        await init();

        // クエリパラメータから現在のラジオボタンの選択状態を取得
        const includeImpl = document.querySelector('input[name="impl-option"]:checked').value === 'include';

        // CSVから構造体を生成
        let structCode;
        try {
            structCode = generate_struct_from_csv(csvContent, includeImpl);
        } catch (error) {
            console.error('Error generating struct:', error);
            return;
        }

        output.textContent = structCode;

        // 出力の表示/非表示
        if (!structCode || structCode.trim() === "") {
            codeBlock.style.display = 'none';
        } else {
            codeBlock.style.display = 'block';
            Prism.highlightElement(output);
        }

        // ダウンロードリンクの設定
        const lines = csvContent.split('\n');
        const structName = lines[0].split(',')[1].trim();
        const blob = new Blob([structCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        downloadBtn.download = `${structName}.rs`;
        downloadBtn.style.display = 'block';
    };

    // 再出力ボタンのクリックイベント
    if (reOutputBtn) {
        reOutputBtn.addEventListener('click', async () => {
            saveRadioStateToURL(); // ラジオボタンの状態をURLに保存
            await generateStruct(); // 再度生成
        });
    }

    // ラジオボタンの変更時にもURLを更新
    document.querySelectorAll('input[name="impl-option"]').forEach((radio) => {
        radio.addEventListener('change', saveRadioStateToURL);
    });
});
