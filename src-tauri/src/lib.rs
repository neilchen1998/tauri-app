#[derive(serde::Serialize)]
struct DropdownOption {
    value: String,
    label: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct Payload {
    key: String,
    value: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_dropdown_options() -> Result<Vec<DropdownOption>, String> {
    let options = vec![
        DropdownOption {
            value: "backend1".to_string(),
            label: "Backend Option 1".to_string(),
        },
        DropdownOption {
            value: "backend2".to_string(),
            label: "Backend Option 2".to_string(),
        },
        DropdownOption {
            value: "backend3".to_string(),
            label: "Backend Option 3".to_string(),
        },
        DropdownOption {
            value: "backend4".to_string(),
            label: "Backend Option 4".to_string(),
        },
        DropdownOption {
            value: "backend5".to_string(),
            label: "Backend Option Neil".to_string(),
        },
    ];

    Ok(options)
}

#[tauri::command]
fn process_dropdown_value(value: &str) -> String {
    println!("Selected value from frontend: {}", value);

    std::thread::sleep(std::time::Duration::from_millis(500));

    format!("Received: {}", value)
}

#[tauri::command]
fn save_file(payload: Payload) -> Result<String, String> {
    println!("value 1: {}\tvalue 2: {}", payload.key, payload.value);

    Ok(format!("File saved successfully!"))
}

#[tauri::command]
fn updated_entry(payload: Payload) -> Result<String, String> {

    println!("name 1: {}\tvalue: {}", payload.key, payload.value);

    Ok(format!("{}", payload.value))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_dropdown_options,
            process_dropdown_value,
            save_file,
            updated_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
