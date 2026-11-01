// api.js 模拟后端接口
// 接口1：保存日记接口 POST /api/diary/save
// 保存日记（限制每天只能写一篇）
async function saveDiaryApi(diary) {
  return new Promise((resolve) => {
    const list = getAllDiary();

    // 生成当天日期，格式和存储保持一致 YYYY-MM-DD
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    // 校验：当天是否已有日记
    const exist = list.some(item => item.date === today);
    if (exist) {
      resolve({
        code: 1,
        msg: "今天已经写过日记啦，每天记录一篇就够啦~"
      });
      return;
    }

    // 正常保存
    const newDiary = {
      id: Date.now(),
      title: diary.title,
      mood: diary.mood,
      content: diary.content,
      date: today
    };
    list.unshift(newDiary);
    localStorage.setItem("moodDiaryList", JSON.stringify(list));
    resolve({
      code: 0,
      msg: "保存成功",
      data: newDiary
    });
  });
}


//接口2：查询日记接口 GET /api/diary/getList
async function getDiaryListApi() {
    await new Promise(resolve => setTimeout(resolve,300));
    const diaryList = JSON.parse(localStorage.getItem("moodDiaryList")) || [];
    return {
        code:0,
        msg:"查询成功",
        data: diaryList
    }
}

//接口3：修改日记接口 PUT /api/diary/update
async function updateDiaryApi(diaryInfo) {
    await new Promise(resolve => setTimeout(resolve, 300));
    let diaryList = JSON.parse(localStorage.getItem("moodDiaryList")) || [];
    //找到对应id日记
    const index = diaryList.findIndex(item => item.id === diaryInfo.id);
    if(index === -1){
        return {code: 1, msg: "日记不存在"};
    }
    diaryList[index].title = diaryInfo.title;
    diaryList[index].mood = diaryInfo.mood;
    diaryList[index].content = diaryInfo.content;
    localStorage.setItem("moodDiaryList", JSON.stringify(diaryList));
    return {code:0, msg:"修改成功", data:diaryList[index]};
}

//接口4：删除日记接口 DELETE /api/diary/delete
async function deleteDiaryApi(id) {
    await new Promise(resolve => setTimeout(resolve, 300));
    let diaryList = JSON.parse(localStorage.getItem("moodDiaryList")) || [];
    const newList = diaryList.filter(item => item.id !== id);
    localStorage.setItem("moodDiaryList", JSON.stringify(newList));
    return {code:0, msg:"删除成功"};
}

//接口5：按月聚合情绪统计接口 GET /api/diary/getMonthStats
async function getMonthStatsApi(yearMonth) {
    await new Promise(resolve => setTimeout(resolve, 300));
    // yearMonth格式："2026-10"
    const diaryList = JSON.parse(localStorage.getItem("moodDiaryList")) || [];
    //筛选当前月份日记
    const monthData = diaryList.filter(item => item.date.startsWith(yearMonth));
    //统计每种情绪出现次数
    const statObj = {};
    monthData.forEach(item => {
        if(statObj[item.mood]){
            statObj[item.mood] +=1;
        }else{
            statObj[item.mood] =1;
        }
    })
    //转成数组
    const series = Object.keys(statObj).map(key=>{
        return {name:key, value:statObj[key]}
    })
    return {
        code:0,
        msg:"查询月度统计成功",
        data:{
            list: series,
            total: monthData.length
        }
    }
}

// 获取全部日记
function getAllDiary() {
  return JSON.parse(localStorage.getItem("moodDiaryList")) || [];
}

//接口6：关键词搜索接口 ======
function searchDiary(keyword) {
  const list = getAllDiary();
  // 空关键词返回全部数据
  if(!keyword || keyword.trim() === ""){
    return list;
  }
  const kw = keyword.toLowerCase();
  // 在标题、情绪、日记内容中匹配关键词
  return list.filter(item => 
    item.title.toLowerCase().includes(kw) ||
    item.content.toLowerCase().includes(kw) ||
    item.mood.toLowerCase().includes(kw)
  )
}

// 导出JSON接口
function exportDiaryJson() {
  const data = getAllDiary();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `情绪日记备份_${new Date().toLocaleDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

//3.导入JSON解析接口
function importDiaryJson(file) {
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = e=>{
      try{
        const importData = JSON.parse(e.target.result);
        // 简单校验数据格式
        if(!Array.isArray(importData)){
          reject("文件格式错误，必须是日记数组");
          return;
        }
        // 合并导入（可改为覆盖，按需切换）
        let oldList = getAllDiary();
        // 简单去重，根据id判断
        importData.forEach(newItem=>{
          const exist = oldList.find(i=>i.id === newItem.id);
          if(!exist) oldList.push(newItem);
        })
        localStorage.setItem("diaryList", JSON.stringify(oldList));
        resolve("导入成功");
      }catch(err){
        reject("JSON解析失败,文件损坏");
      }
    }
    reader.readAsText(file);
  })
}

// ========== 日间/夜间主题切换 ==========
(function initTheme() {
    const saved = localStorage.getItem("moodDiaryTheme");
    if (saved === "light") {
        document.body.classList.add("light");
    }
    updateBtnIcon();

    function toggleTheme() {
        document.body.classList.toggle("light");
        const isLight = document.body.classList.contains("light");
        localStorage.setItem("moodDiaryTheme", isLight ? "light" : "dark");
        updateBtnIcon();
    }

    function updateBtnIcon() {
        const btn = document.getElementById("themeBtn");
        if (!btn) return;
        const isLight = document.body.classList.contains("light");
        btn.textContent = isLight ? "☀️" : "🌙";
    }

    document.addEventListener("DOMContentLoaded", () => {
        const btn = document.getElementById("themeBtn");
        if (btn) btn.addEventListener("click", toggleTheme);
    });
})();

// ========== 悬浮白噪音播放器 ==========
(function initMusicPlayer() {
    const toggleBtn = document.getElementById('musicToggle');
    const listBox = document.getElementById('musicList');
    const audio = document.getElementById('bgAudio');
    if (!toggleBtn || !listBox || !audio) return;

    audio.volume = 0.4; // 默认音量 40%

    // 展开/收起列表
    toggleBtn.addEventListener('click', () => {
        listBox.classList.toggle('show');
    });

    // 点击曲目播放/切换
    document.querySelectorAll('.music-item').forEach(item => {
        item.addEventListener('click', () => {
            const src = item.dataset.src;

            // 如果点击的是当前正在播放的 → 暂停
            if (item.classList.contains('playing')) {
                audio.pause();
                item.classList.remove('playing');
                return;
            }

            // 切换播放
            document.querySelectorAll('.music-item').forEach(i => i.classList.remove('playing'));
            item.classList.add('playing');
            audio.src = src;
            audio.play().catch(() => {
                // 浏览器阻止自动播放时的静默处理
            });
        });
    });

    // 点击页面其他地方收起列表
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.music-player')) {
            listBox.classList.remove('show');
        }
    });
})();


