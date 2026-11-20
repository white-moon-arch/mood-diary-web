// 原有：登录/注册面板切换逻辑，完全保留
const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

// ========== 登录提交：对接后端 LoginServlet ==========
const loginForm = document.querySelector("#loginForm");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.querySelector("#loginUser").value.trim();
  const password = document.querySelector("#loginPwd").value.trim();

  if (!username || !password) {
    alert("账号密码不能为空");
    return;
  }

  // 请求后端登录接口，校验 MySQL 中的账号
  fetch("login", {
    method: "POST",
    credentials: "include", // 新增这一行
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.code === 0) {
      // 前端标记登录状态，供其他页面做拦截
      localStorage.setItem("isLogin", "true");
      localStorage.setItem("loginUser", username);
      alert("登录成功");
      window.location.href = "index.html";
    } else {
      alert(data.msg);
    }
  })
  .catch(() => {
    alert("登录请求失败，请确认 Jetty 服务已启动");
  });
});

// ========== 注册提交：对接后端 RegisterServlet ==========
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

  // 请求后端注册接口，账号写入 MySQL user 表
  fetch("register", {
    method: "POST",
    credentials: "include", // 新增这一行
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.code === 0) {
      alert("注册成功，请登录");
      // 注册成功自动切回登录面板
      container.classList.remove("sign-up-mode");
    } else {
      alert(data.msg);
    }
  })
  .catch(() => {
    alert("注册请求失败，请确认 Jetty 服务已启动");
  });
});
