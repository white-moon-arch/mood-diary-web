//main.js
const checkBox = document.getElementById('customMoodCheck');
const customInput = document.getElementById('customMoodInput');
const moodSelect = document.getElementById('moodSelect');
const saveBtn = document.getElementById('saveBtn');

checkBox.addEventListener('change',function(){
    if(this.checked){
        customInput.style.display = 'block';
        moodSelect.disabled = true;
    }else{
        customInput.style.display = 'none';
        moodSelect.disabled = false;
    }
})

//保存按钮，调用【保存日记接口】
saveBtn.addEventListener('click', async function(){
    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();
    let mood;
    if(checkBox.checked){
        mood = customInput.value.trim();
    }else{
        mood = moodSelect.options[moodSelect.selectedIndex].text;
    }
    if(!title || !mood || !content){
        alert("标题、情绪、内容不能为空");
        return;
    }
    //调用保存接口
    const res = await saveDiaryApi({title,mood,content});
    if(res.code ===0){
        alert(res.msg);
        //保存成功后清空表单
        document.getElementById('titleInput').value="";
        customInput.value="";
        document.getElementById('contentInput').value="";
        checkBox.checked=false;
        customInput.style.display='none';
        moodSelect.disabled=false;
    }
})
