use wasm_bindgen::prelude::*;
use csv::{ReaderBuilder, StringRecord};
use itertools::izip;
use std::fmt;

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

macro_rules! console_log {
  // Note that this is using the `log` function imported above during
  // `bare_bones`
  ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct Position {
    row: usize,
    column: usize,
}

#[wasm_bindgen]
impl Position {
    #[wasm_bindgen(constructor)]
    pub fn new(row: usize, column: usize) -> Position {
        let row_index = row -1;
        let column_index = column -1;
        Position { row: row_index, column: column_index }
    }
}

// Displayトレイトを実装
impl fmt::Display for Position {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
      write!(f, "row: {}, column: {}", self.row, self.column)
  }
}

#[wasm_bindgen]
pub fn generate_struct_from_csv(csv_data: &str, include_impl: bool) -> String {
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
    struct_code.push_str("\n}\n");

    // include_implがtrueの場合にのみimplブロックを追加
    if include_impl {
        struct_code.push_str(&format!("\nimpl {} {{\n", struct_name));
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
    }

    struct_code
}

#[wasm_bindgen]
pub fn generate_struct_from_custom_csv (
    csv_data: &str,
    include_impl: bool,
    struct_name_position: Position,
    struct_detail_position: Position,
    logical_name_position: Position,
    physical_name_position: Position,
    type_position: Position,
    detail_position: Position,
) -> String {
    let mut rdr = ReaderBuilder::new()
        .has_headers(false)
        .from_reader(csv_data.as_bytes());

    let mut struct_code = String::new();

    // 構造体名と詳細を取得
    let struct_name = get_paticular_position_cell_value_from_csv(&mut rdr, &struct_name_position);
    let struct_detail = get_paticular_position_cell_value_from_csv(&mut rdr, &struct_detail_position);
    console_log!("struct_detail_position: {}", &struct_name_position);
    console_log!("struct_name: {}", &struct_name);
    console_log!("struct_detail_position: {}", &struct_detail_position);
    console_log!("struct_detail: {}", &struct_detail);


    // フィールドの情報を取得
    let logical_names = get_particular_position_column_values_from_csv(csv_data.as_bytes(), &logical_name_position);
    let physical_names = get_particular_position_column_values_from_csv(csv_data.as_bytes(), &physical_name_position);
    let types = get_particular_position_column_values_from_csv(csv_data.as_bytes(), &type_position);
    let details = get_particular_position_column_values_from_csv(csv_data.as_bytes(), &detail_position);

    // 構造体のコメントと定義を作成
    struct_code.push_str(&format!("/// {}\n", struct_detail));
    struct_code.push_str(&format!("#[derive(Debug)]\nstruct {} {{\n", struct_name));

    // Argumentsセクションの追加
    struct_code.push_str("    /// # Fields\n");

    // フィールド情報をもとに構造体のフィールドを追加
    for (logical_name, physical_name, detail) in izip!(&logical_names, &physical_names, &details) {
      struct_code.push_str(&format!("    /// * {}({}) - {}\n", physical_name, logical_name, detail));
    }
    for (physical_name, field_type) in izip!(&physical_names, &types) {
      struct_code.push_str(&format!("    {}: {},\n", physical_name, field_type));
    }

    struct_code.push_str("}\n");

    // `impl` ブロックを追加 (必要なら)
    if include_impl {
        struct_code.push_str(&format!("\nimpl {} {{\n", struct_name));
        struct_code.push_str("    fn new(");

        // 引数リストを作成
        let mut args = Vec::new();
        for (physical_name, field_type) in izip!(&physical_names, &types) {
            args.push(format!("{}: {}", physical_name, field_type));
        }
        struct_code.push_str(&args.join(", "));
        struct_code.push_str(&format!(") -> {} {{\n", struct_name));

        // 構造体のフィールド初期化
        struct_code.push_str(&format!("        {} {{\n", struct_name));
        for physical_name in physical_names {
            struct_code.push_str(&format!("            {},\n", physical_name));
        }
        struct_code.push_str("        }\n");
        struct_code.push_str("    }\n");
        struct_code.push_str("}\n");
    }

    struct_code
}

pub fn get_paticular_position_cell_value_from_csv<R: std::io::Read>(
  rdr: &mut csv::Reader<R>,
  position: &Position,
) -> String {
  let mut record = StringRecord::new();

  // 指定された行までイテレート
  for current_row in 0..=position.row {
      // 1行読み込む
      if rdr.read_record(&mut record).is_err() {
          return "CSVの行が不足しています。".to_string();
      }

      // 指定された行に到達したら
      if let Some(value) = record.get(position.column) {
        return value.to_string();
      }
      

      if current_row == position.row {
          // 指定された列の値を取得
          if let Some(value) = record.get(position.column) {
              return value.to_string();
          } else {
              return "指定された列は存在しません。".to_string();
          }
      }
  }
  
  "指定された行は存在しません。".to_string()
}

// get_particular_position_column_values_from_csv関数を修正
pub fn get_particular_position_column_values_from_csv<R: std::io::Read + AsRef<[u8]> + Clone>(
  data: R,
  position: &Position,
) -> Vec<String> {
  // まずデータを使用してReaderを作成
  let mut reader = csv::ReaderBuilder::new()
      .has_headers(false)
      .from_reader(std::io::Cursor::new(data.clone())); // `data`をクローンして新しいCursorに渡す

  // CSVの行数を取得
  let num_rows = reader.records().count();

  // 行数と列数のチェック
  if position.row >= num_rows {
      return vec![format!("指定された行数 {} はCSVの行数 {} を超えています", position.row, num_rows)];
  }

  // 列の存在を確認するために、最初の行を取得
  let headers = match reader.headers() {
      Ok(headers) => headers,
      Err(_) => return vec!["CSVのヘッダーを読み込めませんでした".to_string()],
  };

  if position.column >= headers.len() {
      return vec![format!("指定された列数 {} はCSVの列数 {} を超えています", position.column, headers.len())];
  }

  let mut values = Vec::new();

  // 再度Readerを初期化して指定された列のデータを取得
  let mut reader = csv::ReaderBuilder::new()
      .has_headers(false)
      .from_reader(std::io::Cursor::new(data)); // クローンしなくてもこの時点で`data`を再利用可能

  for (i, result) in reader.records().enumerate() {
      match result {
          Ok(record) => {
              // 指定された行以降のデータを取得
              if i >= position.row {
                  if let Some(value) = record.get(position.column) {
                      values.push(value.to_string());
                  }
              }
          }
          Err(_) => return vec!["CSVのレコードを読み込めませんでした".to_string()],
      }
  }

  values
}
