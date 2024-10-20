import init, { generate_struct_from_custom_csv, Position } from './pkg/rust_struct_creator_wasm.js';

window.addEventListener('DOMContentLoaded', async (event) => {
    const fileInput = document.getElementById('file-input');
    const output = document.getElementById('output');
    const codeBlock = document.getElementById('code-block');
    const downloadBtn = document.getElementById('download-btn');
    const reOutputBtn = document.getElementById('re-output-btn');

    let csvContent = '';

    // ラジオボタンの状態を取得
    const params = new URLSearchParams(window.location.search);
    const implOption = params.get('impl-option') || 'include';
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

    // 構造体生成の処理
    const generateStruct = async () => {
        if (!csvContent) return;

        await init();

        // クエリパラメータから現在のラジオボタンの選択状態を取得
        const includeImpl = document.querySelector('input[name="impl-option"]:checked').value === 'include';

        // URLパラメータを取得
        const params = new URLSearchParams(window.location.search);
        const structNamePositionParams = params.get('struct_name_position') || '1-2'; // デフォルト値
        const structDetailPositionParams = params.get('struct_detail_position') || '-'; // デフォルト値
        const logicalNamePositionParams = params.get('logical_name_position') || '5-2'; // デフォルト値
        const physicalNamePositionParams = params.get('physical_name_position') || '5-3'; // デフォルト値
        const typePositionParams = params.get('type_position') || '5-4'; // デフォルト値
        const detailPositionParams = params.get('detail_position') || '-'; // デフォルト値

        // 座標を取得
        const structNamePos = structNamePositionParams.split('-').map(Number);
        const structDetailPos = structDetailPositionParams.split('-').map(Number);
        const logicalNamePos = logicalNamePositionParams.split('-').map(Number);
        const physicalNamePos = physicalNamePositionParams.split('-').map(Number);
        const typePos = typePositionParams.split('-').map(Number);
        const detailPos = detailPositionParams.split('-').map(Number);
        console.log(`detail_position: ${detailPos[0]}-${detailPos[1]}`);

        // CSVから構造体を生成
        let structCode;
        try {
            structCode = generate_struct_from_custom_csv(
                csvContent,
                includeImpl,
                new Position(structNamePos[0], structNamePos[1]),
                new Position(structDetailPos[0], structDetailPos[1]),
                new Position(logicalNamePos[0], logicalNamePos[1]),
                new Position(physicalNamePos[0], physicalNamePos[1]),
                new Position(typePos[0], typePos[1]),
                new Position(detailPos[0], detailPos[1])
            );
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
            await generateStruct();
        });
    }
});
