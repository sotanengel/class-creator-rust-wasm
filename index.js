import init, { generate_struct_from_csv } from './pkg/rust_struct_creator_wasm.js';

window.addEventListener('DOMContentLoaded', async (event) => {
    const fileInput = document.getElementById('file-input');
    const output = document.getElementById('output');
    const codeBlock = document.getElementById('code-block');
    const downloadBtn = document.getElementById('download-btn');
    const reOutputBtn = document.getElementById('re-output-btn');

    let csvContentArray = []; // csvContentArrayを定義

    // クエリパラメータからラジオボタンの状態を取得
    const params = new URLSearchParams(window.location.search);
    const implOption = params.get('impl-option') || 'include'; // デフォルトは 'include'

    // ラジオボタンの選択状態をセット
    document.querySelector(`input[name="impl-option"][value="${implOption}"]`).checked = true;

    // ファイル選択時にCSVを読み込む
    if (fileInput) {
        fileInput.addEventListener('change', async function() {
            const files = this.files;
            for (const file of files) {
                if (file.type === 'text/csv') {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        csvContentArray.push(event.target.result); // 変換するCSVを配列に追加
                        await generateStruct(); // 呼び出しを正しいスコープ内で行う
                    };
                    reader.readAsText(file);
                }
            }
        });
    }

    // ドロップゾーンの処理を追加
    const dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        fileInput.files = files; // fileInputにファイルを設定

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type === 'text/csv') {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    csvContentArray.push(event.target.result); // 変換するCSVを配列に追加
                    await generateStruct(); // 呼び出しを正しいスコープ内で行う
                };
                reader.readAsText(file);
            }
        }
    });

    // ラジオボタンの状態をクエリパラメータに保存
    const saveRadioStateToURL = () => {
        const selectedValue = document.querySelector('input[name="impl-option"]:checked').value;
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('impl-option', selectedValue);
        history.replaceState(null, '', `?${newParams.toString()}`); // URLを更新
    };

    // 構造体生成の処理
    const generateStruct = async () => {
        if (csvContentArray.length === 0) return;

        await init();

        const includeImpl = document.querySelector('input[name="impl-option"]:checked').value === 'include';
        const zip = new JSZip();

        for (let i = 0; i < csvContentArray.length; i++) {
            let structCode;
            try {
                structCode = generate_struct_from_csv(csvContentArray[i], includeImpl);
            } catch (error) {
                console.error('Error generating struct:', error);
                continue; // 次のCSVへ
            }

            const lines = csvContentArray[i].split('\n');
            const structName = lines[0].split(',')[1].trim();

            // ZIPファイルに構造体コードを追加
            zip.file(`${structName}.rs`, structCode);

            if (i==0){
              output.textContent = structCode;
              codeBlock.style.display = 'block';
              Prism.highlightElement(output);
            }
        }

        // ZIPファイルを生成
        zip.generateAsync({ type: 'blob' })
            .then((content) => {
                const url = URL.createObjectURL(content);
                downloadBtn.href = url;
                downloadBtn.download = 'structs.zip'; // ZIPファイル名
                downloadBtn.style.display = 'block';
            })
            .catch((error) => {
                console.error('Error generating ZIP:', error);
            });
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
