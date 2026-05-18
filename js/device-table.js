let currentSortCol = "";  // Lưu id cột đang được chọn để sort (ví dụ: "col-phoneId")
let isSortAsc = true;     // true: tăng dần (A-Z), false: giảm dần (Z-A)
// Hàm định dạng thời gian chạy máy
function formatTime(millis) {
    if (!millis || isNaN(millis)) return "-";
    const d = new Date(Number(millis));
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// 1. HÀM CỐT LÕI: Phân tích dữ liệu Firebase để nạp vào Dropbox và chuẩn bị bảng
function rebuildTableAndFilters() {
    const filterSelect = document.getElementById('device-filter-select');
    if (!filterSelect) return;
    
    // Lưu lại thiết bị đang chọn lọc hiện tại
    const preFilterVal = filterSelect.value;
    filterSelect.innerHTML = '<option value="">-- Tất cả máy --</option>';
    
    if (!globalCachedDevices || Object.keys(globalCachedDevices).length === 0) {
        const tbody = document.getElementById('devices-table-body');
        if (tbody) tbody.innerHTML = `<tr><td colspan="20" style="text-align: center; color: #999;">Không có dữ liệu thiết bị.</td></tr>`;
        return;
    }
    
    let uniquePhones = new Set();

    // Duyệt qua toàn bộ cấu trúc để tìm phoneId nạp vào Dropbox select máy
    Object.keys(globalCachedDevices).forEach(phoneId => {
        if(['SYSTEM_PASSWORD_SET', 'KHOI_TAO', 'auth_config', 'devices'].includes(phoneId)) return;
        uniquePhones.add(phoneId);
    });

    // Nạp danh sách máy vào Dropbox lọc
    Array.from(uniquePhones).sort().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p; 
        opt.innerText = `Máy: ${p}`;
        if(p === preFilterVal) opt.selected = true;
        filterSelect.appendChild(opt);
    });

    // 🚀 GỌI HÀM VẼ BẢNG PC VÀ MOBILE TỪ DỮ LIỆU ĐANG CÓ
    renderMonitorTablePC(globalCachedDevices);
}

// 2. HÀM VẼ BẢNG MÁY TÍNH (PC): Khắc phục lỗi trắng bảng
function renderMonitorTablePC(data) {
    const container = document.getElementById('monitor-table-container-pc');
    if (!container) return;

    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#999;">Không có dữ liệu để hiển thị.</div>`;
        return;
    }

    const filterSelect = document.getElementById('device-filter-select');
    const activeFilter = filterSelect ? filterSelect.value : "";

    // Cấu hình danh sách các cột chuẩn
    const defaultCols = [
        { id: "col-action", label: "Hành Động" },
        { id: "col-status", label: "Trạng Thái" },
        { id: "col-command", label: "Lệnh Chờ" },
        { id: "col-phoneId", label: "phoneId" },
        { id: "col-userName", label: "userName" },
        { id: "col-userType", label: "userType" },
        { id: "col-appTT", label: "appTT" },
        { id: "col-userGroup", label: "userGroup" },
        { id: "col-tuongTac", label: "tuongTacAccount" },
        { id: "col-log", label: "msgHistory (Log)" },
        { id: "col-emailTT", label: "emailTT" },
        { id: "col-passwordTT", label: "passwordTT" },
        { id: "col-passwordEmail", label: "passwordEmail" },
        { id: "col-glID", label: "glID" },
        { id: "col-keyAuth", label: "keyAuthenticator" },
        { id: "col-glUsername", label: "glUsername" },
        { id: "col-userCookie", label: "userCookie" },
        { id: "col-platformId", label: "platformId" },
        { id: "col-todayMillis", label: "todayMillis" }
    ];

    let cols = [...defaultCols];
    try {
        const saved = localStorage.getItem(`tmtool_cols_${loggedInUserEmail || 'default'}`);
        if (saved) {
            let savedArr = JSON.parse(saved);
            let validSaved = savedArr.filter(s => defaultCols.some(d => d.id === s.id));
            defaultCols.forEach(d => {
                if (!validSaved.some(v => v.id === d.id)) validSaved.push({ id: d.id, visible: true });
            });
            cols = validSaved.map(v => {
                let found = defaultCols.find(d => d.id === v.id);
                return { id: v.id, label: found ? found.label : v.id, visible: v.visible };
            });
        } else {
            cols = defaultCols.map(c => ({ ...c, visible: true }));
        }
    } catch(e) {
        cols = defaultCols.map(c => ({ ...c, visible: true }));
    }

    // 1. BÓC TÁCH DỮ LIỆU THÀNH MẢNG PHẲNG ĐỂ CHUẨN BỊ SORT
    let flatRows = [];
    Object.keys(data).forEach(phoneId => {
        if (['SYSTEM_PASSWORD_SET', 'KHOI_TAO', 'auth_config', 'devices'].includes(phoneId)) return;
        if (activeFilter && phoneId !== activeFilter) return;

        const phoneNode = data[phoneId] || {};
        let accountsObj = {};

        if (phoneNode.accounts && typeof phoneNode.accounts === 'object') {
            accountsObj = phoneNode.accounts;
        } else {
            Object.keys(phoneNode).forEach(k => {
                if (phoneNode[k] && typeof phoneNode[k] === 'object' && (phoneNode[k].userType || phoneNode[k].userName)) {
                    accountsObj[k] = phoneNode[k];
                }
            });
        }

        const currentRun = phoneNode.current_running || {};
        const commandObj = phoneNode.command || {};

        if (Object.keys(accountsObj).length === 0) {
            flatRows.push({
                phoneId: phoneId, userName: "Chưa có tài khoản", userType: "-", status: "STOPPED", activeCommand: "NONE",
                appTT: 0, userGroup: 0, tuongTacAccount: false, msgHistory: "Thiết bị trống", emailTT: "-",
                passwordTT: "-", passwordEmail: "-", glID: "-", keyAuthenticator: "-", glUsername: "-", userCookie: "-", platformId: "-", todayMillis: 0
            });
        }

        Object.keys(accountsObj).forEach(uName => {
            const acc = accountsObj[uName] || {};
            let finalStatus = acc.status || "STOPPED";
            let finalMsg = acc.msgHistory || acc.log || "";
            let finalCmd = acc.activeCommand || "NONE";

            if (currentRun && currentRun.userName === uName) {
                if (currentRun.status) finalStatus = currentRun.status;
                if (currentRun.lastMsg) finalMsg = currentRun.lastMsg;
            }
            if (commandObj && commandObj.userName === uName && commandObj.action) {
                finalCmd = commandObj.action;
            }

            flatRows.push({
                phoneId: phoneId, userName: uName, userType: acc.userType || "", appTT: acc.appTT || 0, userGroup: acc.userGroup || 0,
                tuongTacAccount: acc.tuongTacAccount || false, msgHistory: finalMsg, emailTT: acc.emailTT || "", passwordTT: acc.passwordTT || "",
                passwordEmail: acc.passwordEmail || "", glID: acc.glID || 0, keyAuthenticator: acc.keyAuthenticator || "",
                glUsername: acc.glUsername || "", userCookie: acc.userCookie || "", platformId: acc.platformId || "",
                status: finalStatus, activeCommand: finalCmd, todayMillis: (currentRun && currentRun.userName === uName) ? (currentRun.todayMillis || acc.todayMillis || 0) : (acc.todayMillis || 0)
            });
        });
    });

    // 🚀 2. THỰC HIỆN LOGIC SẮP XẾP (SORT) DỮ LIỆU TRÊN MẢNG PHẲNG
    if (currentSortCol) {
        flatRows.sort((a, b) => {
            let valA = "", valB = "";
            
            // Ánh xạ id cột sang thuộc tính dữ liệu tương ứng của object
            if (currentSortCol === "col-phoneId") { valA = a.phoneId; valB = b.phoneId; }
            else if (currentSortCol === "col-userName") { valA = a.userName; valB = b.userName; }
            else if (currentSortCol === "col-status") { valA = a.status; valB = b.status; }
            else if (currentSortCol === "col-command") { valA = a.activeCommand; valB = b.activeCommand; }
            else if (currentSortCol === "col-userType") { valA = a.userType; valB = b.userType; }
            else if (currentSortCol === "col-appTT") { valA = Number(a.appTT); valB = Number(b.appTT); }
            else if (currentSortCol === "col-userGroup") { valA = Number(a.userGroup); valB = Number(b.userGroup); }
            else if (currentSortCol === "col-log") { valA = a.msgHistory; valB = b.msgHistory; }
            else if (currentSortCol === "col-emailTT") { valA = a.emailTT; valB = b.emailTT; }
            else if (currentSortCol === "col-todayMillis") { valA = Number(a.todayMillis); valB = Number(b.todayMillis); }
            else if (currentSortCol === "col-platformId") { valA = a.platformId; valB = b.platformId; }
            else { valA = a.userName; valB = b.userName; } // Mặc định

            // Hỗ trợ so sánh chuỗi tiếng Việt hoặc text thường không phân biệt hoa thường
            if (typeof valA === "string") {
                return isSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                // So sánh số (millis, số máy, appTT)
                return isSortAsc ? (valA - valB) : (valB - valA);
            }
        });
    }

    // 3. DỰNG TIÊU ĐỀ BẢNG THÊM ICON MŨI TÊN CHỈ HƯỚNG SORT
    let html = `<table><thead><tr>`;
    cols.forEach(c => {
        if (c.visible !== false) {
            let arrow = "";
            if (c.id === currentSortCol) {
                arrow = isSortAsc ? " ▲" : " ▼";
            }
            // Thêm style cursor pointer và thuộc tính onclick để nhấn vào tiêu đề là sort được luôn
            if (c.id !== "col-action") {
                html += `<th onclick="toggleSortPC('${c.id}')" style="cursor: pointer; user-select: none;" title="Bấm để sắp xếp">${c.label}<span style="color:#ffc107;">${arrow}</span></th>`;
            } else {
                html += `<th>${c.label}</th>`; // Cột hành động không cần sort
            }
        }
    });
    html += `</tr></thead><tbody>`;

    if (flatRows.length === 0) {
        html += `<tr><td colspan="${cols.filter(c=>c.visible!==false).length}" style="text-align:center; color:#999;">Không có dữ liệu.</td></tr>`;
    } else {
        flatRows.forEach(item => {
            const isRunning = item.status === "RUNNING";
            const safeUserKey = item.userName.replace(/[^a-zA-Z0-9]/g, '_');
            
            html += `<tr class="${isRunning ? 'farming-highlight' : ''}">`;
            
            cols.forEach(c => {
                if (c.visible === false) return;
                
                if (c.id === "col-action") {
                    html += `
                    <td>
                        <div style="display:flex; gap:8px; justify-content:center; margin-bottom:5px;">
                            <button class="btn-mini" style="background:#ffc107; color:#111; padding:2px 6px;" title="Sửa tài khoản" onclick="triggerEditMode('${item.phoneId}','${item.userName}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-mini" style="background:#dc3545; color:white; padding:2px 6px;" title="Xóa tài khoản" onclick="deleteSingleAccount('${item.phoneId}','${item.userName}')">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        <div style="display:flex; gap:3px; align-items:center;">
                            <select style="padding:1px 2px; font-size:11px; margin:0; height:22px; width:105px;" id="pc-cmd-select-${item.phoneId}-${safeUserKey}">
                                <option value="NONE">NONE</option>
                                <option value="FARM_TIKTOK">FARM_TIKTOK</option>
                                <option value="FARM_FACEBOOK">FARM_FACEBOOK</option>
                                <option value="BUFF_LIKE">BUFF_LIKE</option>
                                <option value="BUFF_FOLLOW">BUFF_FOLLOW</option>
                                <option value="STOP">STOP</option>
                            </select>
                            <button style="background:#28a745; color:white; border:none; padding:0 6px; border-radius:3px; cursor:pointer; font-size:10px; font-weight:bold; height:22px;" 
                                    onclick="sendCommandDirectPC('${item.phoneId}','${item.userName}')">
                                Gửi
                            </button>
                        </div>
                    </td>`;
                } else if (c.id === "col-status") {
                    html += `<td style="font-weight:bold;" class="${isRunning ? 'status-running' : 'status-stopped'}">${item.status}</td>`;
                } else if (c.id === "col-command") {
                    html += `<td><span class="cmd-badge ${item.activeCommand !== 'NONE' ? 'cmd-active' : 'cmd-none'}">${item.activeCommand}</span></td>`;
                } else if (c.id === "col-phoneId") {
                    html += `<td style="font-weight:bold; color:#007bff;">${item.phoneId}</td>`;
                } else if (c.id === "col-userName") {
                    html += `<td style="font-weight:bold;">${item.userName}</td>`;
                } else if (c.id === "col-userType") {
                    html += `<td><span style="background:#e1f5fe; color:#0288d1; padding:2px 6px; border-radius:4px; font-weight:bold;">${item.userType}</span></td>`;
                } else if (c.id === "col-appTT") {
                    html += `<td>${item.appTT}</td>`;
                } else if (c.id === "col-userGroup") {
                    html += `<td>${item.userGroup}</td>`;
                } else if (c.id === "col-tuongTac") {
                    html += `<td style="text-align:center;">${item.tuongTacAccount ? '✅' : '❌'}</td>`;
                } else if (c.id === "col-log") {
                    html += `<td class="limit-cell" title="${item.msgHistory}">${item.msgHistory}</td>`;
                } else if (c.id === "col-emailTT") {
                    html += `<td>${item.emailTT}</td>`;
                } else if (c.id === "col-passwordTT") {
                    html += `<td>${item.passwordTT}</td>`;
                } else if (c.id === "col-passwordEmail") {
                    html += `<td>${item.passwordEmail}</td>`;
                } else if (c.id === "col-glID") {
                    html += `<td>${item.glID}</td>`;
                } else if (c.id === "col-keyAuth") {
                    html += `<td>${item.keyAuthenticator}</td>`;
                } else if (c.id === "col-glUsername") {
                    html += `<td>${item.glUsername}</td>`;
                } else if (c.id === "col-userCookie") {
                    html += `<td class="limit-cell" title="${item.userCookie}">${item.userCookie}</td>`;
                } else if (c.id === "col-platformId") {
                    html += `<td>${item.platformId}</td>`;
                } else if (c.id === "col-todayMillis") {
                    html += `<td>${formatTime(item.todayMillis)}</td>`;
                }
            });
            html += `</tr>`;
        });
    }

    html += `</tbody></table>`;
    container.innerHTML = html;

    if (typeof renderMobileCards === 'function') {
        renderMobileCards(flatRows);
    }
}

// Hàm gửi lệnh xử lý riêng ký tự đặc biệt của userName
function sendCommandDirectPC(phoneId, userName) {
    if (!targetOwner || !phoneId || !userName) return;
    const safeUserKey = userName.replace(/[^a-zA-Z0-9]/g, '_');
    const selectEl = document.getElementById(`pc-cmd-select-${phoneId}-${safeUserKey}`);
    if (!selectEl) return;
    
    const chosenAction = selectEl.value;
    
    database.ref(`manager_devices/${targetOwner}/${phoneId}/command`).set({
        action: chosenAction,
        userName: userName,
        time: Date.now()
    }).then(() => {
        alert(`✓ Đã phát lệnh [ ${chosenAction} ] gửi tới máy ${phoneId}`);
    }).catch(e => alert("Lỗi gửi lệnh: " + e.message));
}

// 3. HÀM SỰ KIỆN: Khi chuyển đổi giá trị Dropbox chọn máy
function filterTableByPhoneId(val) {
    // Chỉ cần gọi lại render, hàm sẽ tự động lấy giá trị mới từ Dropbox để lọc hàng xuất bản
    renderMonitorTablePC(globalCachedDevices);
}
// Hàm điều phối khi người dùng click vào một cột bất kỳ trên tiêu đề bảng
function toggleSortPC(columnId) {
    if (currentSortCol === columnId) {
        // Nếu nhấn lại đúng cột cũ -> Đảo ngược chiều tăng thành giảm hoặc ngược lại
        isSortAsc = !isSortAsc;
    } else {
        // Nếu nhấn vào cột mới -> Chuyển mục tiêu sort sang cột đó và đặt mặc định là tăng dần (A-Z)
        currentSortCol = columnId;
        isSortAsc = true;
    }
    // Gọi hàm render lại giao diện bằng dữ liệu đã lưu trong cache
    if (globalCachedDevices) {
        renderMonitorTablePC(globalCachedDevices);
    }
}
// HÀM DỰNG GIAO DIỆN THEO DẠNG THẺ (CARDS) TRÊN MOBILE
function renderMobileCards(flatRows) {
    const mbody = document.getElementById('devices-mobile-body');
    if (!mbody) return;

    // Xóa sạch dữ liệu thẻ cũ trước khi nạp dữ liệu realtime mới
    mbody.innerHTML = "";

    if (!flatRows || flatRows.length === 0) {
        mbody.innerHTML = `<div style="text-align:center; padding:20px; color:#999; background:#fff; border-radius:8px;">Không có dữ liệu thiết bị.</div>`;
        return;
    }

    // Duyệt qua từng tài khoản trong danh sách phẳng để dựng thẻ mobile riêng biệt
    flatRows.forEach(item => {
        const isRunning = item.status === "RUNNING";
        const safeUserKey = item.userName.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Tạo một khối thẻ (Card) bọc toàn bộ thông tin của 1 tài khoản
        const card = document.createElement('div');
        card.className = `mobile-device-card ${isRunning ? 'farming-highlight' : ''}`;
        
        // Cấu trúc Style nội bộ cho thẻ Mobile gọn gàng, trực quan
        card.style.cssText = `
            background: #ffffff;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        `;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 1px dashed #eee; padding-bottom: 6px;">
                <div>
                    <span style="font-weight: bold; color: #007bff; font-size: 14px;">📱 Máy: ${item.phoneId}</span>
                    <span style="margin: 0 4px; color: #ccc;">|</span>
                    <span style="font-weight: bold; color: #333; font-size: 13px;">👤 ${item.userName}</span>
                </div>
                <span style="background: #e1f5fe; color: #0288d1; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">
                    ${item.userType}
                </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div>
                    <span style="color: #666;">Trạng thái: </span>
                    <span style="font-weight: bold;" class="${isRunning ? 'status-running' : 'status-stopped'}">${item.status}</span>
                </div>
                <div>
                    <span style="color: #666;">Lệnh chờ: </span>
                    <span class="cmd-badge ${item.activeCommand !== 'NONE' ? 'cmd-active' : 'cmd-none'}" style="font-size: 11px; padding: 2px 6px;">
                        ${item.activeCommand}
                    </span>
                </div>
            </div>

            <div style="background: #f8f9fa; padding: 6px 8px; border-radius: 4px; font-size: 11px; color: #555; margin-bottom: 12px; word-break: break-all; max-height: 40px; overflow: hidden; text-overflow: ellipsis;" title="${item.msgHistory}">
                <strong>Log:</strong> ${item.msgHistory || "Không có nhật ký"}
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #eee; padding-top: 10px;">
                
                <div style="display: flex; gap: 10px; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; color: #777; font-weight: 500;">Hành động hệ thống:</span>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-mini" style="background: #ffc107; color: #111; padding: 4px 10px; border-radius: 4px;" onclick="triggerEditMode('${item.phoneId}','${item.userName}')">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn-mini" style="background: #dc3545; color: white; padding: 4px 10px; border-radius: 4px;" onclick="deleteSingleAccount('${item.phoneId}','${item.userName}')">
                            <i class="fas fa-trash-alt"></i> Xóa
                        </button>
                    </div>
                </div>

                <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                    <select style="flex: 1; padding: 4px; font-size: 12px; margin: 0; height: 32px; border-radius: 4px; border: 1px solid #ccc; background: #fff;" id="mobile-cmd-select-${item.phoneId}-${safeUserKey}">
                        <option value="NONE">-- Chọn lệnh muốn chạy --</option>
                        <option value="FARM_TIKTOK">FARM_TIKTOK</option>
                        <option value="FARM_FACEBOOK">FARM_FACEBOOK</option>
                        <option value="BUFF_LIKE">BUFF_LIKE</option>
                        <option value="BUFF_FOLLOW">BUFF_FOLLOW</option>
                        <option value="STOP">STOP</option>
                    </select>
                    <button style="background: #28a745; color: white; border: none; padding: 0 14px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; height: 32px; display: flex; align-items: center; gap: 4px;" 
                            onclick="sendCommandDirectMobile('${item.phoneId}','${item.userName}')">
                        <i class="fas fa-paper-plane"></i> Chạy
                    </button>
                </div>

            </div>
        `;
        
        mbody.appendChild(card);
    });
}

// HÀM PHÁT LỆNH ĐIỀU KHIỂN RIÊNG BIỆT CHO INTERFACE MOBILE
function sendCommandDirectMobile(phoneId, userName) {
    if (!targetOwner || !phoneId || !userName) return;
    const safeUserKey = userName.replace(/[^a-zA-Z0-9]/g, '_');
    const selectEl = document.getElementById(`mobile-cmd-select-${phoneId}-${safeUserKey}`);
    if (!selectEl) return;
    
    const chosenAction = selectEl.value;
    if (chosenAction === "NONE") {
        alert("Vui lòng lựa chọn một chế độ lệnh hành động cụ thể trước khi bấm Chạy!");
        return;
    }
    
    // Đẩy thông tin lệnh Realtime Firebase lên nút điều hướng của máy farm
    database.ref(`manager_devices/${targetOwner}/${phoneId}/command`).set({
        action: chosenAction,
        userName: userName,
        time: Date.now()
    }).then(() => {
        alert(`✓ Mobile: Đã phát lệnh [ ${chosenAction} ] đến thiết bị máy ${phoneId}`);
    }).catch(e => alert("Lỗi gửi lệnh từ Mobile: " + e.message));
}
