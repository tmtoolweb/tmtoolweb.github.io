function loginWithEmail() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password).catch(e => alert(e.message));
}

function logout() { auth.signOut().then(() => location.reload()); }

// Hàm cốt lõi theo dõi trạng thái Đăng nhập hệ thống
auth.onAuthStateChanged((user) => {
    if (user) {
        loggedInUserEmail = user.email;
        // Sửa từ 'login-form' thành ẩn đúng form đăng nhập
        document.getElementById('login-form').style.display = 'none';
        // SỬA TẠI ĐÂY: Thay 'dashboard' thành 'dashboard-layout' cho đúng ID trong HTML của bạn
        document.getElementById('dashboard-layout').style.display = 'flex'; 
        
        // Hiển thị tên User đăng nhập
        if (document.getElementById('user-display')) {
            document.getElementById('user-display').innerText = loggedInUserEmail;
        }
        
        if (loggedInUserEmail === "admin@gmail.com") {
            // SỬA TẠI ĐÂY: Thêm kiểm tra phòng trường hợp không có thẻ 'role-display' tránh lỗi Script
            const roleDisp = document.getElementById('role-display');
            if (roleDisp) roleDisp.innerText = "(Tổng Quản Trị)";
            
            document.getElementById('admin-management-section').style.display = 'block';
            document.getElementById('admin-selector-box').style.display = 'flex';
            loadAllUsersForAdmin();
        } else {
            // SỬA TẠI ĐÂY: Kiểm tra an toàn cho thẻ 'role-display'
            const roleDisp = document.getElementById('role-display');
            if (roleDisp) roleDisp.innerText = "(Thành Viên)";
            
            document.getElementById('admin-management-section').style.display = 'none';
            document.getElementById('admin-selector-box').style.display = 'none';
            
            // Cắt chuỗi lấy uKey
            targetOwner = loggedInUserEmail.split('@')[0];
            listenToDeviceData(targetOwner);
        }
    } else {
        document.getElementById('login-form').style.display = 'block';
        // SỬA TẠI ĐÂY: Thay 'dashboard' thành 'dashboard-layout'
        document.getElementById('dashboard-layout').style.display = 'none';
    }
});

function listenToDeviceData(uKey) {
    if (!uKey) return;
    // Bật trạng thái hiển thị đang tải dữ liệu trên bảng
    const tbody = document.getElementById('devices-table-body');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="19" style="text-align: center; color: #007bff; font-weight: bold;">⚡ Đang đồng bộ dữ liệu Realtime từ [ ${uKey} ]...</td></tr>`;
    }

    // Lắng nghe trực tiếp đường dẫn gốc của uKey
    database.ref(`manager_devices/${uKey}`).on('value', (snapshot) => {
        const data = snapshot.val() || {};
        
        // SỬA TẠI ĐÂY: Loại bỏ hoàn toàn việc ép cấu trúc data.devices rườm rà
        globalCachedDevices = data; 
        
        // Gọi hàm dựng lại bộ lọc Dropbox chọn máy và đổ dữ liệu lên bảng
        rebuildTableAndFilters();
    }, (error) => {
        console.error("Lỗi đồng bộ Firebase:", error);
    });
}

// Sửa lại hàm khi Admin click chọn user từ Dropbox
function onAdminSelectUser(uKey) {
    if (!uKey) {
        globalCachedDevices = {};
        targetOwner = "";
        rebuildTableAndFilters();
        return;
    }
    targetOwner = uKey;
    // Gọi lại hàm lắng nghe chính xác cây dữ liệu của uKey được chọn
    listenToDeviceData(uKey);
}
// Đồng bộ thêm hàm xem dữ liệu của hàng Click trong bảng Admin (nếu có)
function forceSelectUserByAdmin(uKey) {
    const select = document.getElementById('admin-user-select');
    if (select) {
        select.value = uKey;
        onAdminSelectUser(uKey);
    }
}

// Cập nhật hàm load data Admin an toàn hơn
function loadAllUsersForAdmin() {
    database.ref('manager_devices').on('value', (snapshot) => {
        const root = snapshot.val() || {};
        const tbody = document.getElementById('admin-user-table-body');
        const select = document.getElementById('admin-user-select');
        
        if(select) select.innerHTML = '<option value="">-- Chọn User đồng bộ --</option>';
        if(tbody) tbody.innerHTML = "";
        
        let stt = 1;
        let userKeys = Object.keys(root).filter(k => k !== 'admin');
        
        const countBadge = document.getElementById('total-users-count');
        if(countBadge) countBadge.innerText = userKeys.length;

        userKeys.forEach(uKey => {
            const userNode = root[uKey] || {};
            let countDevices = 0;
            let countAccs = 0;
            let dNode = userNode.devices || userNode; 
            
            if(dNode && typeof dNode === 'object') {
                Object.keys(dNode).forEach(pId => {
                    if(pId !== 'SYSTEM_PASSWORD_SET' && pId !== 'KHOI_TAO' && pId !== 'auth_config') {
                        countDevices++;
                        let accs = dNode[pId].accounts || dNode[pId];
                        if(accs && typeof accs === 'object') {
                            countAccs += Object.keys(accs).filter(k => typeof accs[k] === 'object' && (accs[k].userType || accs[k].userName)).length;
                        }
                    }
                });
            }

            if(select) {
                const opt = document.createElement('option');
                opt.value = uKey; 
                opt.innerText = `${uKey} | ${countDevices} máy | ${countAccs} account`;
                if(targetOwner === uKey) opt.selected = true;
                select.appendChild(opt);
            }

            if(tbody) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align:center; font-weight:bold;">${stt++}</td>
                    <td style="font-weight:bold; color:#007bff;">${uKey}@gmail.com</td>
                    <td style="text-align:center; font-weight:bold; color:green;">${countDevices} máy | ${countAccs} acc</td>
                    <td style="text-align:center;">
                        <button class="btn-mini" style="background:#007bff; margin:2px; color:white;" onclick="forceSelectUserByAdmin('${uKey}')">👁️ Xem Data</button>
                        <button class="btn-mini" style="background:#ffc107; color:#111; margin:2px;" onclick="openPasswordModal('${uKey}')">🔑 Set Pass</button>
                    </td>
                `;
                tbody.appendChild(tr);
            }
        });
    });
}