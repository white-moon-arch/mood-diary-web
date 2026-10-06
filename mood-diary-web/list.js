// list.js 分页代码基础上新增编辑删除逻辑
const diaryListDom = document.getElementById("diaryList");
const pageInfoDom = document.getElementById("pageInfo");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const editMask = document.getElementById("editMask");
const editTitle = document.getElementById("editTitle");
const editMood = document.getElementById("editMood");
const editContent = document.getElementById("editContent");
const editId = document.getElementById("editId");
const cancelEdit = document.getElementById("cancelEdit");
const saveEdit = document.getElementById("saveEdit");

let currentPage = 1;
const pageSize = 2;

async function renderList() {
    const res = await getDiaryListApi();
    const diaryData = res.data;

    if (diaryData.length === 0) {
        diaryListDom.innerHTML = `
            <div class="card" style="text-align:center; color:#888; padding:40px 20px;">
                暂无情绪日记记录
            </div>
        `;
        pageInfoDom.innerText = `第0页`;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    const maxPage = Math.ceil(diaryData.length / pageSize);
    if(currentPage > maxPage) currentPage = maxPage;
    if(currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * pageSize;
    const pageData = diaryData.slice(start, start + pageSize);

    let html = "";
    pageData.forEach(item => {
        html += `
            <div class="card" style="margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3>${item.title}</h3>
                    <span>${item.mood}</span>
                </div>
                <p>${item.content}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
                    <span style="color:#666;">${item.date}</span>
                    <div>
                        <button onclick="openEdit(${item.id})">编辑</button>
                        <button onclick="delDiary(${item.id})">删除</button>
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

// 删除函数：二次确认弹窗
window.delDiary = async function(id){
    if(window.confirm("确定要删除这条日记吗？删除后不可恢复！")){
        await deleteDiaryApi(id);
        renderList();
    }
}

// 打开编辑弹窗，回填数据
window.openEdit = async function(id){
    const res = await getDiaryListApi();
    const diary = res.data.find(item=>item.id === id);
    if(!diary) return;
    editId.value = diary.id;
    editTitle.value = diary.title;
    editMood.value = diary.mood;
    editContent.value = diary.content;
    editMask.classList.add("show");
}

//关闭弹窗
cancelEdit.addEventListener("click",()=>{
    editMask.classList.remove("show");
})

//保存编辑，空内容校验
saveEdit.addEventListener("click", async ()=>{
    const title = editTitle.value.trim();
    const mood = editMood.value.trim();
    const content = editContent.value.trim();
    const id = Number(editId.value);
    //空内容校验
    if(!title || !mood || !content){
        alert("标题、情绪、内容不能为空！");
        return;
    }
    const res = await updateDiaryApi({id,title,mood,content});
    if(res.code === 0){
        alert("修改成功");
        editMask.classList.remove("show");
        renderList();
    }else{
        alert(res.msg);
    }
})

//分页事件
prevBtn.addEventListener("click", () => {
    currentPage--;
    renderList();
});
nextBtn.addEventListener("click", () => {
    currentPage++;
    renderList();
});

renderList();
