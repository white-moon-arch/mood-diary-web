// 登录状态校验：未登录自动跳转登录页
if (!localStorage.getItem("isLogin")) {
    window.location.href = "sign.html";
}

const diaryListDom = document.getElementById("diaryList");
const pageInfoDom = document.getElementById("pageInfo");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchKeyword");
const editMask = document.getElementById("editMask");
const editTitle = document.getElementById("editTitle");
const editMood = document.getElementById("editMood");
const editContent = document.getElementById("editContent");
const editId = document.getElementById("editId");
const cancelEdit = document.getElementById("cancelEdit");
const saveEdit = document.getElementById("saveEdit");

let currentPage = 1;
const pageSize = 10;
let currentData = []; // 存储从后端获取的日记数据

// ========== 从后端加载日记列表 ==========
async function loadDiaryList() {
    try {
        const res = await fetch("diary");
        const data = await res.json();
        if (data.code === 0) {
            // 字段映射：统一字段名，兼容原有渲染逻辑
            currentData = data.data.map(item => ({
                id: item.id,
                title: item.title,
                mood: item.mood,
                content: item.content,
                date: item.createTime
            }));
            renderDiaryList();
        } else {
            showToast(data.msg);
            setTimeout(() => {
                window.location.href = "sign.html";
            }, 1000);
        }
    } catch (err) {
        showToast("加载日记失败，请检查服务是否正常");
        console.error(err);
    }
}

// ========== 前端搜索过滤 ==========
function getFilteredData() {
    const kw = searchInput.value.trim();
    if (!kw) return currentData;
    return currentData.filter(item =>
        item.title.includes(kw) || item.content.includes(kw) || item.mood.includes(kw)
    );
}

// ========== 统一渲染函数 ==========
function renderDiaryList() {
    const listData = getFilteredData();

    if (listData.length === 0) {
        diaryListDom.innerHTML = `
            <div class="card" style="text-align:center; color:#888; padding:40px 20px;">
                暂无匹配的日记记录
            </div>
        `;
        pageInfoDom.innerText = `第0页`;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    const maxPage = Math.ceil(listData.length / pageSize);
    if(currentPage > maxPage) currentPage = maxPage;
    if(currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * pageSize;
    const pageData = listData.slice(start, start + pageSize);

    let html = "";
    pageData.forEach(item => {
        html += `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3>${item.title}</h3>
                    <span>${item.mood}</span>
                </div>
                <p>${item.content}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
                    <span style="color:#666;">${item.date}</span>
                    <div>
                        <button onclick="openEdit(${item.id})" style="padding:6px 14px;margin-right:8px;">编辑</button>
                        <button onclick="delDiary(${item.id})" style="padding:6px 14px;">删除</button>
                    </div>
                </div>
            </div>
        `;
    });
    diaryListDom.innerHTML = html;
    pageInfoDom.innerText = `第${currentPage}页 / 共${maxPage}页`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= maxPage;
}

// ========== 搜索功能 ==========
searchBtn.addEventListener("click", () => {
    currentPage = 1;
    renderDiaryList();
});

// ========== 分页 ==========
prevBtn.addEventListener("click", () => {
    currentPage--;
    renderDiaryList();
});
nextBtn.addEventListener("click", () => {
    currentPage++;
    renderDiaryList();
});

// ======== 新增：编辑弹窗心情按钮点击事件 ========
document.querySelectorAll("#editMoodGroup .mood-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#editMoodGroup .mood-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("editMood").value = btn.dataset.mood;
    });
});

// ========== 删除功能：对接后端接口 ==========
window.delDiary = function(id){
    showConfirm("确定要删除这条日记吗？删除后不可恢复！", async () => {
        try {
            const res = await fetch("diary?action=delete", {
                method: "POST",
                credentials: "include", // 新增这一行
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `id=${id}`
            });
            const data = await res.json();
            if (data.code === 0) {
                showToast("删除成功");
                await loadDiaryList(); // 删除后刷新列表
            } else {
                showToast(data.msg);
            }
        } catch (err) {
            showToast("删除失败");
            console.error(err);
        }
    });
}

// ========= 编辑功能：打开弹窗 =========
window.openEdit = function(id){
    const diary = currentData.find(item => item.id === id);
    if(!diary) return;
    editId.value = diary.id;
    editTitle.value = diary.title;
    editContent.value = diary.content;

    // ===== 替换原来的 editMood.value = diary.mood; =====
    const mood = diary.mood;
    // 遍历所有心情按钮，匹配到的高亮，其他的取消选中
    document.querySelectorAll("#editMoodGroup .mood-btn").forEach(btn => {
        if(btn.dataset.mood === mood) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    // 给隐藏域赋值，保存逻辑保持不变
    editMood.value = mood;
    // =================================================

    editMask.classList.add("show");
}


cancelEdit.addEventListener("click",()=>{
    editMask.classList.remove("show");
    // 清除所有心情按钮的选中样式
    document.querySelectorAll("#editMoodGroup .mood-btn").forEach(b => b.classList.remove("active"));
})


// ========== 保存编辑：对接后端更新接口 ==========
saveEdit.addEventListener("click", async ()=>{
    const title = editTitle.value.trim();
    const mood = editMood.value.trim();
    const content = editContent.value.trim();
    const id = Number(editId.value);
    if(!title || !mood || !content){
        showToast("标题、情绪、内容不能为空！");
        return;
    }
    try {
        const res = await fetch("diary?action=update", {
            method: "POST",
            credentials: "include", // 新增这一行
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `id=${id}&title=${encodeURIComponent(title)}&mood=${encodeURIComponent(mood)}&content=${encodeURIComponent(content)}`
        });
        const data = await res.json();
        if(data.code === 0){
            showToast("修改成功");
            editMask.classList.remove("show");
            await loadDiaryList(); // 修改后刷新列表
        }else{
            showToast(data.msg);
        }
    } catch (err) {
        showToast("修改失败");
        console.error(err);
    }
})

// ========== 导出功能：导出数据库中的日记数据 ==========
document.getElementById("exportBtn").addEventListener("click", exportDiaryJson);

function exportDiaryJson() {
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `日记备份_${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("导出成功");
}

// ========== 导入功能：批量导入到数据库 ==========
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFile");

importBtn.addEventListener("click", () => {
    importFileInput.click();
});

importFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const data = JSON.parse(event.target.result);
            if (!Array.isArray(data)) {
                showToast("文件格式错误，请选择正确的日记备份文件");
                return;
            }
            if (!confirm("导入将新增所有日记到当前账号，确定继续吗？")) {
                return;
            }

            showToast("正在导入，请稍候...");
            let successCount = 0;
            // 逐条调用新增接口（小数据量可用，大数据量建议后端批量接口）
            for (const item of data) {
                try {
                    await fetch("diary?action=add", {
                        method: "POST",
                        credentials: "include", // 新增这一行
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        body: `title=${encodeURIComponent(item.title)}&mood=${encodeURIComponent(item.mood)}&content=${encodeURIComponent(item.content)}&supplementMood=`
                    });
                    successCount++;
                } catch (err) {
                    console.error("单条导入失败", err);
                }
            }
            showToast(`导入完成，成功${successCount}条`);
            await loadDiaryList();
        } catch (err) {
            showToast("文件解析失败，请检查文件是否损坏");
        }
        importFileInput.value = "";
    };
    reader.readAsText(file);
});

// 页面初始化：从后端加载数据
loadDiaryList();
