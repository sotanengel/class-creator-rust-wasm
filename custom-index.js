import init, { generate_struct_from_custom_csv, Position } from './pkg/rust_struct_creator_wasm.js';

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

        // クエリパラメータから現在のラジオボタンの選択状態を取得
        const includeImpl = document.querySelector('input[name="impl-option"]:checked').value === 'include';
        const zip = new JSZip();

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
        for (let i = 0; i < csvContentArray.length; i++) {
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


        // ダウンロードリンクの設定
        const lines = csvContent.split('\n');
        const structName = lines[0].split(',')[1].trim();
        const blob = new Blob([structCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        downloadBtn.download = `${structName}.rs`;
        downloadBtn.style.display = 'block';

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
