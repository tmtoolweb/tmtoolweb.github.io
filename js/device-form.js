function triggerEditMode(phoneId, userName) {
    let acc = globalCachedDevices[phoneId]?.accounts?.[userName] || globalCachedDevices[phoneId]?.[userName];
    if(!acc) return;
    
    currentEditingId = { phoneId, userName };
    document.getElementById('form-title').innerText = `Chỉnh sửa: ${userName}`;
    document.getElementById('f-phoneId').value = phoneId;
    document.getElementById('f-phoneId').disabled = true;
    document.getElementById('f-userName').value = userName;
    document.getElementById('f-userName').disabled = true;
    
    // Đổ dữ liệu ra các trường input form
    document.getElementById('f-userType').value = acc.userType || "";
    document.getElementById('f-emailTT').value = acc.emailTT || "";
    document.getElementById('f-passwordTT').value = acc.passwordTT || "";
    
    document.getElementById('btn-cancel-edit').style.display = "inline-block";
    switchMenu(null, 'tab-add-device');
}

function cancelEditMode() {
    currentEditingId = null;
    document.getElementById('form-title').innerText = "Nhập Thủ Công";
    document.getElementById('f-phoneId').disabled = false;
    document.getElementById('f-userName').disabled = false;
    document.getElementById('btn-cancel-edit').style.display = "none";
}

function userAddDeviceManually() {
    const pId = document.getElementById('f-phoneId').value.trim();
    const uName = document.getElementById('f-userName').value.trim();
    // Tiến hành thu thập payload và update lên Firebase...
    database.ref(`manager_devices/${targetOwner}/${pId}/accounts/${uName}`).update({ userType: "Tiktok" })
    .then(() => { alert("Đã lưu!"); cancelEditMode(); switchMenu(null, 'tab-monitor'); });
}

function deleteSingleAccount(phoneId, userName) {
    if(!confirm("Bạn có chắc chắn muốn xóa?")) return;
    database.ref(`manager_devices/${targetOwner}/${phoneId}/accounts/${userName}`).remove();
}