package nwafu.edu.cn;


import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import nwafu.edu.cn.util.DBUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/diary")
public class DiaryServlet extends HttpServlet {

    // 统一处理：获取登录用户
    private String getLoginUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return null;
        return (String) session.getAttribute("loginUser");
    }

    // 新增/修改日记用POST
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("utf-8");
        resp.setContentType("application/json;charset=utf-8");
        PrintWriter out = resp.getWriter();

        String username = getLoginUser(req);
        if (username == null) {
            out.write("{\"code\":1,\"msg\":\"请先登录\"}");
            return;
        }
        

        String action = req.getParameter("action");
        String title = req.getParameter("title");
        String mood = req.getParameter("mood");
        String supplementMood = req.getParameter("supplementMood");
        String content = req.getParameter("content");

        Connection conn = null;
        PreparedStatement pstmt = null;

        try {
            conn = DBUtil.getConnection();
            if ("add".equals(action)) {
                // ========== 新增：每日一篇校验 ==========
                PreparedStatement checkStmt = null;
                ResultSet rs = null;
                try {
                    // 查询当前登录用户当天的日记总数
                    String checkSql = "SELECT COUNT(*) FROM diary WHERE username = ? AND DATE(create_time) = CURDATE()";
                    checkStmt = conn.prepareStatement(checkSql);
                    checkStmt.setString(1, username);
                    rs = checkStmt.executeQuery();

                    // 当天已有记录，直接返回提示，不执行插入
                    if (rs.next() && rs.getInt(1) > 0) {
                        out.write("{\"code\":1,\"msg\":\"今天已经写过日记啦，每天记录一篇就够啦~\"}");
                        return;
                    }
                } finally {
                    // 校验用完立即释放资源
                    if (rs != null) rs.close();
                    if (checkStmt != null) checkStmt.close();
                }

                // ========== 原有新增日记逻辑保持不变 ==========
                pstmt = conn.prepareStatement("INSERT INTO diary(username,title,mood,supplementMood,content) VALUES(?,?,?,?,?)");
                pstmt.setString(1, username);
                pstmt.setString(2, title);
                pstmt.setString(3, mood);
                pstmt.setString(4, supplementMood);
                pstmt.setString(5, content);
                int rows = pstmt.executeUpdate();

                out.write(rows > 0 ? "{\"code\":0,\"msg\":\"保存成功\"}" : "{\"code\":1,\"msg\":\"保存失败\"}");
            }else if ("delete".equals(action)) {
                // 删除日记
                String id = req.getParameter("id");
                pstmt = conn.prepareStatement("DELETE FROM diary WHERE id = ? AND username = ?");
                pstmt.setInt(1, Integer.parseInt(id));
                pstmt.setString(2, username);
                int rows = pstmt.executeUpdate();
                out.write(rows > 0 ? "{\"code\":0,\"msg\":\"删除成功\"}" : "{\"code\":1,\"msg\":\"删除失败\"}");
            }
            // 在 delete 分支后面追加
            else if ("update".equals(action)) {
                String id = req.getParameter("id");
                pstmt = conn.prepareStatement("UPDATE diary SET title=?, mood=?, content=? WHERE id=? AND username=?");
                pstmt.setString(1, title);
                pstmt.setString(2, mood);
                pstmt.setString(3, content);
                pstmt.setInt(4, Integer.parseInt(id));
                pstmt.setString(5, username);
                int rows = pstmt.executeUpdate();
                out.write(rows > 0 ? "{\"code\":0,\"msg\":\"修改成功\"}" : "{\"code\":1,\"msg\":\"修改失败\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            out.write("{\"code\":1,\"msg\":\"服务器异常\"}");
        } finally {
            DBUtil.close(pstmt, conn);
            out.close();
        }
    }

    // 查询日记用GET
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=utf-8");
        PrintWriter out = resp.getWriter();

        String username = getLoginUser(req);
        if (username == null) {
            out.write("{\"code\":1,\"msg\":\"请先登录\"}");
            return;
        }

        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            conn = DBUtil.getConnection();
            pstmt = conn.prepareStatement("SELECT id,title,mood,supplementMood,content,create_time FROM diary WHERE username = ? ORDER BY create_time DESC");
            pstmt.setString(1, username);
            rs = pstmt.executeQuery();

            List<String> list = new ArrayList<>();
            while (rs.next()) {
                String item = String.format(
                    "{\"id\":%d,\"title\":\"%s\",\"mood\":\"%s\",\"supplementMood\":\"%s\",\"content\":\"%s\",\"createTime\":\"%s\"}",
                    rs.getInt("id"),
                    rs.getString("title").replace("\"", "\\\""),
                    rs.getString("mood"),
                    rs.getString("supplementMood") == null ? "" : rs.getString("supplementMood"),
                    rs.getString("content").replace("\"", "\\\""),
                    rs.getString("create_time")
                );
                list.add(item);
            }

            // 拼接JSON返回
            String data = "[" + String.join(",", list) + "]";
            out.write("{\"code\":0,\"data\":" + data + "}");
        } catch (Exception e) {
            e.printStackTrace();
            out.write("{\"code\":1,\"msg\":\"服务器异常\"}");
        } finally {
            DBUtil.close(rs, pstmt, conn);
            out.close();
        }
    }
}
