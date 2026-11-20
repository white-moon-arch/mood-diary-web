// 登录状态校验：未登录自动跳转登录页
if (!localStorage.getItem("isLogin")) {
    window.location.href = "sign.html";
}

const checkBox = document.getElementById('customMoodCheck');
const customInput = document.getElementById('customMoodInput');
const moodSelect = document.getElementById('moodSelect');
const saveBtn = document.getElementById('saveBtn');

checkBox.addEventListener('change', function(){
    if(this.checked){
        customInput.style.display = 'block';
        moodSelect.disabled = true;
    }else{
        customInput.style.display = 'none';
        moodSelect.disabled = false;
    }
})

// 保存按钮：调用后端日记保存接口
saveBtn.addEventListener('click', async function(){
    console.log("点击了保存按钮");

    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();
    let mood;
    if(checkBox.checked){
        mood = customInput.value.trim();
    }else{
        mood = moodSelect.options[moodSelect.selectedIndex].text;
    }

    if(!title || !mood || !content){
        showToast("标题、情绪、内容不能为空");
        return;
    }

    try {
        // 请求后端接口，日记数据存入 MySQL
        const response = await fetch("diary?action=add", {
            method: "POST",
            credentials: "include", // 新增这一行
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `title=${encodeURIComponent(title)}&mood=${encodeURIComponent(mood)}&supplementMood=&content=${encodeURIComponent(content)}`
        });

        const res = await response.json();

        if(res.code === 0){
            showToast(res.msg);
            // 保存成功后清空表单（原有逻辑完全保留）
            document.getElementById('titleInput').value = "";
            customInput.value = "";
            document.getElementById('contentInput').value = "";
            checkBox.checked = false;
            customInput.style.display = 'none';
            moodSelect.disabled = false;
        } else {
            showToast(res.msg);
        }
    } catch (error) {
        showToast("保存失败，请检查服务是否正常");
        console.error(error);
    }
})
