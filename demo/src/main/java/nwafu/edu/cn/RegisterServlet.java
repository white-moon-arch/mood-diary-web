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

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {
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
            // 1. 检查用户名是否已存在
            pstmt = conn.prepareStatement("SELECT id FROM user WHERE username = ?");
            pstmt.setString(1, username);
            rs = pstmt.executeQuery();
            if (rs.next()) {
                out.write("{\"code\":1,\"msg\":\"用户名已存在\"}");
                return;
            }

            // 2. 插入新用户
            pstmt = conn.prepareStatement("INSERT INTO user(username,password) VALUES(?,?)");
            pstmt.setString(1, username);
            pstmt.setString(2, password);
            int rows = pstmt.executeUpdate();

            if (rows > 0) {
                out.write("{\"code\":0,\"msg\":\"注册成功\"}");
            } else {
                out.write("{\"code\":1,\"msg\":\"注册失败\"}");
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

