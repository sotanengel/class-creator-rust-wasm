use wasm_bindgen::prelude::*;
use csv::ReaderBuilder;

#[wasm_bindgen]
pub fn generate_struct_from_csv(csv_data: &str) -> String {
    let mut rdr = ReaderBuilder::new()
        .has_headers(false) // ヘッダーを無視する
        .from_reader(csv_data.as_bytes());

    let mut struct_code = String::new();

    // 1行目から構造体名を取得
    let struct_name = match rdr.records().next() {
        Some(Ok(record)) => record.get(1).unwrap_or("").to_string(), // 構造体名を取得
        _ => "UnnamedStruct".to_string(), // エラー処理
    };

    // 構造体の定義
    struct_code.push_str(&format!("#[derive(Debug)]\nstruct {} {{\n", struct_name));

    // 5行目をスキップして、6行目以降をフィールドとして処理
    for (i, record) in rdr.records().enumerate() {
        if i < 2 {
            continue; // 1行目と2行目をスキップ
        }

        let record = match record {
            Ok(r) => r,
            Err(_) => continue, // エラー処理
        };

        // 論理名、物理名、型を取得
        let physical_name = record.get(2).unwrap_or(""); // 物理名
        let field_type = record.get(3).unwrap_or(""); // 型をそのまま使用

        struct_code.push_str(&format!("    {}: {},\n", physical_name, field_type));
    }

    struct_code.push_str("}\n");
    struct_code
}
