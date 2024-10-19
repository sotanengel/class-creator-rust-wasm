use wasm_bindgen::prelude::*;
use csv::ReaderBuilder;

#[wasm_bindgen]
pub fn generate_struct_from_csv(csv_data: &str) -> String {
    let mut rdr = ReaderBuilder::new()
        .has_headers(false)
        .from_reader(csv_data.as_bytes());

    let mut struct_code = String::new();

    // 1行目から構造体名を取得
    let struct_name = match rdr.records().next() {
        Some(Ok(record)) => record.get(1).unwrap_or("").to_string(),
        _ => "UnnamedStruct".to_string(),
    };

    // 2行目から構造体の詳細を取得
    let struct_description = match rdr.records().next() {
        Some(Ok(record)) => record.get(1).unwrap_or("").to_string(),
        _ => "".to_string(),
    };

    // 3行目を飛ばす
    rdr.records().next();

    // 構造体のフィールドを定義するための準備
    let mut fields = Vec::new();
    let mut field_names = Vec::new();
    let mut arguments_comment = String::new();

    // フィールドとその詳細を処理
    for result in rdr.records().skip(1) {
        if let Ok(record) = result {
            let logical_name = record.get(1).unwrap_or("").to_string();   // 論理名
            let physical_name = record.get(2).unwrap_or("").to_string();  // 物理名
            let field_type = record.get(3).unwrap_or("").to_string();     // 型
            let field_detail = record.get(4).unwrap_or("").to_string();   // 詳細

            // Argumentsコメントの各フィールドの説明を追加
            arguments_comment.push_str(&format!("    /// * {}({}) - {}\n", physical_name, logical_name, field_detail));

            // 各フィールドの定義を追加
            fields.push(format!("    {}: {},", physical_name, field_type));
            field_names.push((physical_name, field_type));
        }
    }

    // 構造体のコメントを追加
    struct_code.push_str(&format!("/// {}\n", struct_description));
    struct_code.push_str(&format!("#[derive(Debug)]\nstruct {} {{\n", struct_name));

    // Argumentsセクションの追加
    struct_code.push_str("    /// # Fields\n");
    struct_code.push_str(&arguments_comment);

    // フィールドを追加
    struct_code.push_str(&fields.join("\n"));
    struct_code.push_str("\n}\n\n");

    // implブロックとnew関数を追加
    struct_code.push_str(&format!("impl {} {{\n", struct_name));
    struct_code.push_str("    fn new(");

    // new関数の引数リストを作成
    let mut new_args = Vec::new();
    for (physical_name, field_type) in &field_names {
        new_args.push(format!("{}: {}", physical_name, field_type));
    }
    struct_code.push_str(&new_args.join(", "));
    struct_code.push_str(&format!(") -> {} {{\n", struct_name));

    // 構造体のフィールドを初期化するコードを追加
    struct_code.push_str(&format!("        {} {{\n", struct_name));
    for (physical_name, _) in &field_names {
        struct_code.push_str(&format!("            {},\n", physical_name));
    }
    struct_code.push_str("        }\n");
    struct_code.push_str("    }\n");
    struct_code.push_str("}\n");

    struct_code
}
