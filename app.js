const express = require('express');
const server = express();

const cors = require('cors');

const bodyParser = require('body-parser');

const md5 = require('md5');

const mysql = require('mysql');
const pool = mysql.createPool({
  //MySQL数据库服务器的地址
  host:'127.0.0.1',
  //端口号
  port:3306,
  //数据库用户的用户名
  user:'root',
  //数据库用户的密码
  password:'',
  //数据库名称
  database:'xzqa',
  //最大连接数据
  connectionLimit:10
});


server.use(cors({
  origin:['http://127.0.0.1:8080','http://localhost:8080']
}));


server.use(bodyParser.urlencoded({
  extended:false
}));

// 获取所有文章分类的接口
server.get('/category',(req,res)=>{
  //查找文章分类表中的所有数据
  let sql = 'SELECT id,category_name FROM xzqa_category';
  //通过MySQL连接池执行SQL语句
  pool.query(sql,(err,results)=>{
    if(err) throw err;
    res.send({message:'查询成功',code:1,results:results});
  });
});

//获取特定分类下的文章信息的接口

server.get('/lists',(req,res)=>{
  //接收客户端传递的URL参数中的cid  -- 文章分类ID
  let cid = req.query.cid;

  //接收客户端传递的URL参数中的page -- 页码
  let page = req.query.page;

  //存储每页显示的记录数(其实pagesize就是一个纯变量,与分页没有任何关系)
  let pagesize = 15;

  //根据MySQL分页的标准计算公式计算出offset参数值,并且带入到SQL语句中
  let offset = (page - 1) * pagesize;

  //现以接收到cid为条件进行文章信息的查找,此时的pagesize才是真正的返回多少条记录呢
  let sql = 'SELECT id,subject,description,image FROM xzqa_article WHERE category_id = ? LIMIT ' + offset + ',' + pagesize;

  //存储总记录数
  let rowcount;
  //存储总页数
  let pagecount;
  
  //执行SQL查询
  pool.query(sql,[cid],(err,result)=>{
    if(err) throw err;
    /////////////////   
    //1.获取记录数
    sql = 'SELECT COUNT(id) AS count FROM xzqa_article WHERE category_id=?';
    pool.query(sql,[cid],(err,results)=>{
      if(err) throw err;    
      rowcount = results[0].count;
      //2.计算总页数
      pagecount = Math.ceil(rowcount / pagesize);
      //返回原来的查询记录的数据及总页数信息
      res.send({message:'查询成功',code:1,results:result,pagecount:pagecount});   
    });
    /////////////////
   
  })
});


//获取特定文章信息的API接口
server.get('/article',(req,res)=>{
  //获取文章ID
  let id = req.query.id;

  //SQL查询 -- 多表(内)连接
  let sql = 'SELECT r.id,subject,content,created_at,nickname,avatar,article_number FROM xzqa_author AS u INNER JOIN xzqa_article  AS r ON  author_id = u.id WHERE r.id=?';
  //执行SQL语句
  pool.query(sql,[id],(err,results)=>{
    if(err) throw err;
    res.send({message:'查询成功',code:1,result:results[0]});
  });
});

//用户注册的接口
server.post('/register',(req,res)=>{
  //接收用户以post方式提交的数据
  let username = req.body.username;
  let password = req.body.password;
  let sql = 'select id from xzqa_author where username=?';
  pool.query(sql,[username],(err,results)=>{
    if(err) throw err;
    if(results.length == 0){
      sql = 'insert into xzqa_author(username,password) values(?,MD5(?))';
      pool.query(sql,[username,password],(err,results)=>{
        if(err) throw err;
        res.send({message:'注册成功',code:1})
      });
    }else{
        res.send({message:'注册失败，用户已存在',code:0})
    }
  })
});

//用户登录的接口
server.post('/login',(req,res)=>{
  //获取用户输入的用户名和密码信息
  let username = req.body.username;
  let password = md5(req.body.password);
  let sql = 'select id,username,nickname,avatar from xzqa_author where username=? and password=?';
  pool.query(sql,[username,password],(err,results)=>{
    if(err) throw err;
    if(results.length==1){
      //如果找到，则代表用户登录成功
      res.send({message:'登录成功',code:'1',info:results[0]})
    }else{
      //否则代表用户登录失败
      res.send({message:'登录失败',code:0})
    }
  });
});

server.listen(3000,()=>{
  console.log('server is running...');
});
