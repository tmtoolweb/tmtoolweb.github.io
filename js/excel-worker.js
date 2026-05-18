function handleExcelUpload() {
    const input = document.getElementById('excel-file-input');
    if(!input.files.length) return alert("Chưa chọn file!");
    
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const jsonRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        // Tiến hành phân tích chuỗi cột JSON và đồng bộ hàng loạt lên Cloud...
        console.log("Dữ liệu đọc từ Excel: ", jsonRows);
    };
    reader.readAsArrayBuffer(file);
}

function exportTableToExcel() {
    let rows = [];
    // Vòng lặp đọc globalCachedDevices để push dữ liệu cấu trúc vào mảng rows...
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Devices");
    XLSX.writeFile(workbook, `TMTool_Devices.xlsx`);
}