// list.js 修复版：搜索 + 分页 + 编辑删除 全联动
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
const pageSize = 2;
// 当前展示的数据：搜索结果 / 全部数据
let currentData = getAllDiary();

// 统一渲染函数，只基于 currentData
function renderDiaryList() {
    if (currentData.length === 0) {
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

    const maxPage = Math.ceil(currentData.length / pageSize);
    if(currentPage > maxPage) currentPage = maxPage;
    if(currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * pageSize;
    const pageData = currentData.slice(start, start + pageSize);

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
    const kw = searchInput.value.trim();
    currentData = searchDiary(kw);
    currentPage = 1; // 搜索后重置到第1页
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

// ========== 删除功能 ==========
window.delDiary = async function(id){
    if(window.confirm("确定要删除这条日记吗？删除后不可恢复！")){
        await deleteDiaryApi(id);
        // 删除后刷新当前数据
        currentData = searchDiary(searchInput.value.trim());
        renderDiaryList();
    }
}

// ========== 编辑功能 ==========
window.openEdit = async function(id){
    const allList = getAllDiary();
    const diary = allList.find(item=>item.id === id);
    if(!diary) return;
    editId.value = diary.id;
    editTitle.value = diary.title;
    editMood.value = diary.mood;
    editContent.value = diary.content;
    editMask.classList.add("show");
}

cancelEdit.addEventListener("click",()=>{
    editMask.classList.remove("show");
})

saveEdit.addEventListener("click", async ()=>{
    const title = editTitle.value.trim();
    const mood = editMood.value.trim();
    const content = editContent.value.trim();
    const id = Number(editId.value);
    if(!title || !mood || !content){
        alert("标题、情绪、内容不能为空！");
        return;
    }
    const res = await updateDiaryApi({id,title,mood,content});
    if(res.code === 0){
        alert("修改成功");
        editMask.classList.remove("show");
        // 修改后刷新当前数据
        currentData = searchDiary(searchInput.value.trim());
        renderDiaryList();
    }else{
        alert(res.msg);
    }
})

// 页面初始化
renderDiaryList();
