const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});


// 登录表单提交
const loginForm = document.querySelector("#loginForm");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault(); // 阻止表单默认刷新
  const username = document.querySelector("#loginUser").value.trim();
  const password = document.querySelector("#loginPwd").value.trim();

  if (!username || !password) {
    alert("账号密码不能为空");
    return;
  }

  // 读取本地存好的注册用户
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  if (userInfo.username === username && userInfo.password === password) {
    // 标记登录状态
    localStorage.setItem("isLogin", "true");
    localStorage.setItem("loginUser", username);
    alert("登录成功！");
    // 跳转主页
    window.location.href = "index.html";
  } else {
    alert("账号或密码错误");
  }
});


// 注册表单提交
const registerForm = document.querySelector("#registerForm");
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.querySelector("#regUser").value.trim();
  const email = document.querySelector("#regEmail").value.trim();
  const password = document.querySelector("#regPwd").value.trim();

  if (!username || !email || !password) {
    alert("请填写完整信息");
    return;
  }

  // 保存用户到本地
  const userInfo = { username, email, password };
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
  alert("注册成功，请登录");
  // 注册成功切回登录面板
  container.classList.remove("sign-up-mode");
});
