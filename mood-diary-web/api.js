// api.js 模拟后端接口
// 接口1：保存日记接口 POST /api/diary/save
async function saveDiaryApi(diaryInfo) {
    //模拟网络延迟，模拟真实接口请求
    await new Promise(resolve => setTimeout(resolve, 300));

    //读取本地存储的日记数组
    let diaryList = JSON.parse(localStorage.getItem("moodDiaryList")) || [];

    //组装日记数据，自动生成id和当前日期
    const newDiary = {
        id: Date.now(),
        title: diaryInfo.title,
        mood: diaryInfo.mood,
        content: diaryInfo.content,
        date: new Date().toISOString().split('T')[0]
    };
    diaryList.unshift(newDiary); //新日记放最前面

    //存入localStorage
    localStorage.setItem("moodDiaryList", JSON.stringify(diaryList));

    //模拟后端返回json格式
    return {
        code: 0,
        msg: "保存成功",
        data: newDiary
    }
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
