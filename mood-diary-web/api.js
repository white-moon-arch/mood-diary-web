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
    const diaryList = getDiaryListApi();
    const diary = diaryList.find(item => item.id == diaryId);

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

// ========== 悬浮白噪音播放器（跨页面续播 修复进度） ==========
(function initMusicPlayer() {
    const toggleBtn = document.getElementById('musicToggle');
    const listBox = document.getElementById('musicList');
    const audio = document.getElementById('bgAudio');
    if (!toggleBtn || !listBox || !audio) return;

    audio.volume = 0.4;
    let savedProgress = 0;
    let savedSrc = '';

    // 1. 读取上次播放状态
    const savedState = localStorage.getItem('musicPlayerState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            savedSrc = state.src || '';
            savedProgress = state.progress || 0;

            if (state.playing && savedSrc) {
                // 高亮对应曲目
                document.querySelectorAll('.music-item').forEach(item => {
                    if (item.dataset.src === savedSrc) {
                        item.classList.add('playing');
                    }
                });

                // 先加载音频
                audio.src = savedSrc;
                // 等元数据加载完成后，再设置进度并播放
                audio.addEventListener('loadedmetadata', function onMeta() {
                    audio.currentTime = savedProgress;
                    audio.play().catch(() => {});
                    audio.removeEventListener('loadedmetadata', onMeta);
                });
            }
        } catch(e) {}
    }

    // 2. 保存播放状态
    function saveState() {
        const currentItem = document.querySelector('.music-item.playing');
        const state = {
            src: currentItem ? currentItem.dataset.src : '',
            playing: !audio.paused,
            progress: audio.currentTime
        };
        localStorage.setItem('musicPlayerState', JSON.stringify(state));
    }

    // 播放/暂停时保存
    audio.addEventListener('play', saveState);
    audio.addEventListener('pause', saveState);
    // 离开页面前强制保存最后进度
    window.addEventListener('beforeunload', saveState);

    // 3. 展开/收起列表
    toggleBtn.addEventListener('click', () => {
        listBox.classList.toggle('show');
    });

    // 4. 点击曲目播放/切换
    document.querySelectorAll('.music-item').forEach(item => {
        item.addEventListener('click', () => {
            const src = item.dataset.src;

            if (item.classList.contains('playing')) {
                audio.pause();
                item.classList.remove('playing');
                saveState();
                return;
            }

            document.querySelectorAll('.music-item').forEach(i => i.classList.remove('playing'));
            item.classList.add('playing');
            audio.src = src;
            audio.play().catch(() => {});
            saveState();
        });
    });

    // 点击空白收起列表
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.music-player')) {
            listBox.classList.remove('show');
        }
    });
})();

// ========== 情绪小知识卡片（点击切换+伸缩动画） ==========
(function initMoodTip() {
    const tipContent = document.getElementById('tipContent');
    const tipRefresh = document.getElementById('tipRefresh');
    if (!tipContent || !tipRefresh) return;

    const tipList = [
'接纳情绪不等于放任情绪，当你觉察到愤怒、委屈或是烦躁涌上心头的时候，可以先看见这份感受的存在，不必急着批判自己，同时给自己一点缓冲时间，慎重选择接下来的行动，避免在情绪裹挟之下说出或者做出事后会后悔的事。',
'我们常常下意识把别人冷淡、不耐烦的态度归因为自己做得不够好，但很多时候对方的负面情绪来源于他自身的压力、疲惫和过往心结，并不代表对你真实的评判，不必把他人的情绪负担全部揽到自己身上。',
'情绪不会因为你刻意压制就凭空消失，强行告诉自己不许难过、不许生气，只会让感受暂时沉到心底，久而久之转化成持续的身心消耗，表现为莫名疲惫、睡眠变差，或是一点小事就容易失控发火。',
'一件事本身很少直接决定你的情绪，真正影响感受的是你看待这件事的解读方式。同样一次失败或者否定，你可以看作是全盘的否定，也可以当成一次可以调整改进的信号，想法转变之后情绪也会跟着平缓下来。',
'情绪崩溃从来都不等于内心脆弱，它更像是情绪容量被长期积攒的压力填满之后的自然溢出。很多一直默默扛事的人都会经历这样的时刻，这是身体和心理发出的信号，提醒你停下脚步，好好照顾自己。',
'过高的期待很容易放大失望带来的痛苦，我们对人和事抱有期待本身没有错，但不切实际、无法由自己掌控的期待，很容易反复刺伤自己。适当放下过高的幻想，不是消极妥协，而是给自己的情绪留出缓冲空间。',
'陷入持续的烦躁和内耗的时候，硬逼着自己思考解决办法往往效果很差，大脑会困在固定的负面回路里。试着离开当下的环境，简单走动、看看窗外，短暂的抽离能够打断情绪循环，让理性慢慢回来。',
'积极乐观并不是要求我们永远没有低落难过的时候，情绪本来就有起伏流转的规律。不必因为开心不起来就责怪自己，允许自己拥有一段安静消沉、什么目标都不想完成的时光，也是一种重要的自我包容。',
'很多人际冲突里，争执双方执着于分辨道理对错，却忽略了彼此当下最核心的需求只是被理解。当人处在强烈情绪中的时候，道理很难听进去，先看见和接纳对方的感受，沟通才有可能平稳继续下去。',
'那些由旧回忆勾起的难过、委屈，并不是过去的伤害再次发生，只是大脑重新唤醒了当初的情绪记忆。你可以清醒地区分回忆和现实，明白危险早已不在，慢慢练习主动把注意力拉回到当下真实的生活里。',
'长期习惯优先照顾别人感受的人，很容易慢慢忽略自己的情绪信号，总是优先满足他人需求，不断妥协退让。持续的消耗会慢慢消磨内心力量，学会识别自己的边界，敢于温和拒绝，是稳定情绪的必修课。',
'比较是扰乱情绪很常见的来源，我们习惯拿自己的短板和别人展现出来的高光对比，却看不到别人背后的难处与挣扎。每个人都有自己的节奏和课题，专注自身的成长，会少很多不必要的焦虑。',
];



    let currentIndex = 0;

    function switchTip() {
        // 1. 先收缩收起
        tipContent.classList.add('collapse');

        // 2. 收缩完成后切换内容，再展开
        setTimeout(() => {
            // 随机取新一条，避免连续重复
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * tipList.length);
            } while (newIndex === currentIndex && tipList.length > 1);
            
            currentIndex = newIndex;
            tipContent.textContent = tipList[currentIndex];
            tipContent.classList.remove('collapse');
        }, 300);
    }

    // 点击刷新按钮切换
    tipRefresh.addEventListener('click', switchTip);
    // 点击内容区域也可以切换
    tipContent.addEventListener('click', switchTip);
})();

// ========== 通用确认弹窗 ==========
function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;

    const cancelBtn = document.getElementById('confirmCancel');
    const okBtn = document.getElementById('confirmOk');
    const contentEl = modal.querySelector('.confirm-content');

    // 设置提示文案
    contentEl.textContent = message;
    // 显示弹窗
    modal.classList.add('show');

    // 确认操作
    function handleConfirm() {
        onConfirm();
        closeModal();
    }

    // 关闭弹窗并解绑事件
    function closeModal() {
        modal.classList.remove('show');
        okBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', closeModal);
    }

    okBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', closeModal);

    // 点击遮罩层也能关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// ========== 通用 Toast 提示 ==========
function showToast(message, type = 'default', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // 创建单条提示元素
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // 触发入场动画
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // 定时消失并移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
