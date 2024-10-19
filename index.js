import init, { generate_struct_from_csv } from './pkg/rust_struct_creator_wasm.js';

window.addEventListener('DOMContentLoaded', (event) => {
    const fileInput = document.getElementById('file-input');
    const output = document.getElementById('output');
    const codeBlock = document.getElementById('code-block');
    const downloadBtn = document.getElementById('download-btn');

    // CSVファイルの読み込みと構造体生成
    if (fileInput) {
      fileInput.addEventListener('change', async function() {
          const reader = new FileReader();
  
          reader.onload = async function(event) {
              const csvContent = event.target.result;

              // Wasmモジュールを初期化
              await init();

              // ラジオボタンの選択を取得
              const includeImpl = document.querySelector('input[name="impl-option"]:checked').value === 'include';

              // Wasm関数を呼び出してCSVから構造体を生成
              let structCode;
              try {
                  structCode = generate_struct_from_csv(csvContent, includeImpl);
                  console.log('Generated structCode:', structCode); // 確認用のログ
              } catch (error) {
                  console.error('Error generating struct:', error);
                  return;
              }

              output.textContent = structCode;

              // outputの内容が空かどうかチェックして非表示にする
              if (!structCode || structCode.trim() === "") {
                  codeBlock.style.display = 'none'; // 空なら非表示
              } else {
                  codeBlock.style.display = 'block'; // 非表示を解除
                  // Prism.jsでハイライトを適用
                  Prism.highlightElement(output);
              }

              // CSVの最初の行から構造体名を取得（1行目が構造体名と仮定）
              const lines = csvContent.split('\n');
              const structName = lines[0].split(',')[1].trim(); // カンマで分割して1つ目を取得

              // テキストファイル用のBlobを生成
              const blob = new Blob([structCode], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);

              // ダウンロードリンクを更新
              downloadBtn.href = url;
              downloadBtn.download = `${structName}.rs`; // 構造体名をファイル名に設定
              downloadBtn.style.display = 'block'; // ボタンを表示
          };
  
          reader.readAsText(this.files[0]);
      });
  }  
});
