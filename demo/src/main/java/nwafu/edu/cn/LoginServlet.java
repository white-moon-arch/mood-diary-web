package nwafu.edu.cn;



import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import nwafu.edu.cn.util.DBUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("utf-8");
        resp.setContentType("application/json;charset=utf-8");
        PrintWriter out = resp.getWriter();

        String username = req.getParameter("username");
        String password = req.getParameter("password");

        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            conn = DBUtil.getConnection();
            pstmt = conn.prepareStatement("SELECT id FROM user WHERE username = ? AND password = ?");
            pstmt.setString(1, username);
            pstmt.setString(2, password);
            rs = pstmt.executeQuery();

            if (rs.next()) {
                // 登录成功，将用户名存入Session
                HttpSession session = req.getSession();
                session.setAttribute("loginUser", username);
                out.write("{\"code\":0,\"msg\":\"登录成功\"}");
            } else {
                out.write("{\"code\":1,\"msg\":\"账号或密码错误\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            out.write("{\"code\":1,\"msg\":\"服务器异常\"}");
        } finally {
            DBUtil.close(rs, pstmt, conn);
            out.close();
        }
    }
}

